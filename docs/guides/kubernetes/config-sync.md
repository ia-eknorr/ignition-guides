---
sidebar_position: 6
applies_to: [kubernetes]
---

# Config Sync: Keeping Gateways in Sync with Git

Ignition stores projects, tag configurations, and resource configuration on disk in the gateway's data directory. In a Kubernetes deployment these files live inside a StatefulSet pod's PVC. The challenge: how do you update those files when a developer merges a change, without replacing pods or manually copying files?

The recommended approach is the [Stoker operator](../../tools/stoker-operator.md), which uses a `GatewaySync` custom resource to keep gateways continuously in sync with a Git repository. After the initial sync, Stoker pushes changes to running gateways by triggering Ignition's built-in project and config scan APIs - the gateway reloads updated resources without restarting.

## How Stoker Config Sync Works

Stoker uses a controller + agent architecture:

- The **controller** watches `GatewaySync` custom resources, resolves git refs, and discovers gateway pods by their labels
- The **agent** runs as a native sidecar inside gateway pods, clones the repo, and syncs files to the gateway's data directory
- The gateway picks up the changes via its scan APIs (`/data/api/v1/scan/projects` and `/data/api/v1/scan/config`) without a pod restart

Communication between controller and agent is via Kubernetes ConfigMaps - no shared PVC required. See the [Stoker operator page](../../tools/stoker-operator.md) for installation, CRD field reference, and webhook receiver setup.

## The GatewaySync Resource

The `GatewaySync` CRD is the primary configuration surface. Each resource targets a specific deployment's pods, names a git source, defines per-gateway **profiles** (source-to-destination path mappings), and optionally applies **patches** to config files (such as setting the gateway system name from a pod variable).

### Worked example: PublicDemo

From `charts/public-demo/templates/gatewaysync.yaml`, the PublicDemo platform deploys a single `GatewaySync` that drives both the frontend and backend gateways via two profiles:

```yaml
apiVersion: stoker.io/v1alpha1
kind: GatewaySync
metadata:
  name: public-demo-sync
  namespace: public-demo
spec:
  git:
    repo: "org-147873951@github.com:inductive-automation/publicdemo-all.git"
    ref: "2.3.10"    # updated by Kargo on each promotion
    auth:
      sshKey:
        secretRef:
          name: git-sync-secret
          key: ssh
  polling:
    enabled: true
    interval: "5m"   # recovery safety net; primary trigger is webhook
  agent:
    resources:
      requests:
        cpu: 50m
        memory: 128Mi
      limits:
        cpu: 200m
        memory: 512Mi
  gateway:
    port: 8043
    tls: true
    api:
      secretName: ignition-api-key
      secretKey: apiKey
  sync:
    defaults:
      excludePatterns:
        - "**/tag-*/MQTT Engine"
        - "**/tag-*/MQTT Transmission"
        - "**/tag-*/System"
        - "**/gateway-network-incoming"
    profiles:
      frontend:
        vars:
          gatewayName: "public-demo-fe"
        mappings:
          - source: "services/ignition-frontend/projects"
            destination: "projects"
          - source: "services/ignition-frontend/config/resources/core"
            destination: "config/resources/core"
          - source: "services/ignition-frontend/config/resources/external"
            destination: "config/resources/external"
          - source: "services/ignition-frontend/config/resources/dev-us-west-2"
            destination: "config/resources/dev-us-west-2"
            patches:
              - file: "ignition/system-properties/config.json"
                set:
                  systemName: "{{.Vars.gatewayName}}-{{.PodOrdinal}}"
          - source: ".versions.json"
            destination: ".versions.json"
      backend:
        vars:
          gatewayName: "public-demo-be"
        mappings:
          - source: "services/ignition-backend/projects"
            destination: "projects"
          - source: "services/ignition-backend/config/resources/core"
            destination: "config/resources/core"
          - source: "services/ignition-backend/config/resources/external"
            destination: "config/resources/external"
          - source: "services/ignition-backend/config/resources/dev-us-west-2"
            destination: "config/resources/dev-us-west-2"
          - source: ".versions.json"
            destination: ".versions.json"
```

Key things to observe in this resource:

- **SSH auth** via a Kubernetes Secret (`git-sync-secret` with key `ssh`). This secret is created by the ExternalSecret wiring described in [External Secrets](./external-secrets.md).
- **Polling as a safety net**: the 5-minute polling interval catches any missed webhook events, but the primary trigger in production is the Stoker webhook receiver responding to Kargo promotion events.
- **Exclude patterns** at `sync.defaults` apply to every profile; they prevent Stoker from overwriting runtime-managed files like MQTT Engine tag providers and incoming Gateway Network connections.
- **Patches** on a mapping: the frontend's `dev-us-west-2` mapping patches `systemName` in `ignition/system-properties/config.json` using the pod's ordinal index, producing stable per-pod system names (`public-demo-fe-0`, `public-demo-fe-1`, etc.) without duplicating config files.
- **Pod labels** are how the controller finds gateway pods. Pods carry annotations like `stoker.io/inject: "true"` and `stoker.io/cr-name: "public-demo-sync"` and `stoker.io/profile: "frontend"` so the controller knows which profile to apply to which pod.

### Enabling Stoker per environment

Stoker is disabled by default in the chart's `values.yaml` and enabled per environment via values overlays:

```yaml
# values/public-demo/prod/environment-values.yaml
stoker:
  enabled: true
  name: public-demo-sync-prod
```

The git ref that Stoker tracks is updated separately by Kargo as part of the promotion pipeline:

```yaml
# values/public-demo/prod/us-west-2/values.yaml (after a Kargo promotion)
git:
  ref: 2.3.10
```

### Seen in the wild: conf-proveit26

The same `GatewaySync` pattern appears in the `conf-proveit26-platform` self-hosted IIoT deployment. That resource adds `knownHosts` to the SSH auth block and uses `vars` to template per-site configuration (MQTT edge node IDs, system names) across many gateways from a single resource. It demonstrates that the same CRD scales from two gateways to dozens.

## Fallback: git-sync with API-triggered Scans

Before Stoker, the platform used a git-sync init container that continuously polled the application repo and called the Ignition scan APIs when it detected a new commit hash. This approach is still in use in environments where Stoker is not yet enabled.

The fallback runs as a long-lived init container (`restartPolicy: Always`) using the `registry.k8s.io/git-sync/git-sync:v4.6.0` image. On each poll cycle, `sync-entrypoint.sh` runs `git-sync --one-time` to fetch the latest ref, then calls `sync-files.sh` which:

1. Copies projects and config resources from the cloned repo to a staging directory
2. Applies exclude patterns to protect runtime-managed files
3. Normalizes gateway system names in `ignition/system-properties/config.json`
4. Atomically swaps the staging directory into place (delete old, copy new)
5. Calls `POST /data/api/v1/scan/projects` and `POST /data/api/v1/scan/config` to trigger reload

Hash-based change detection (`GITSYNC_HASH` vs a stored hash file) prevents the scan from firing on every poll when nothing has changed.

The git-sync approach requires volumes (`git-secret`, `ignition-api-key-secret`, `git-volume`, `sync-scripts`) mounted into the init container and is more complex to configure than a Stoker `GatewaySync` resource. Prefer Stoker for new deployments.

## Further Reading

- [Stoker operator page](../../tools/stoker-operator.md): installation, full CRD field reference, webhook receiver, Helm values
- [Stoker upstream docs](https://ia-eknorr.github.io/stoker-operator/): quickstart, installation reference
- [Ignition scan APIs](https://docs.inductiveautomation.com/docs/8.3/): the `/data/api/v1/scan/projects` and `/data/api/v1/scan/config` endpoints that Stoker calls after syncing

<!-- VERIFY: confirm the Ignition 8.3 REST scan API endpoint paths (/data/api/v1/scan/projects and /data/api/v1/scan/config) are documented at docs.ia.io and link to the correct 8.3 page -->
