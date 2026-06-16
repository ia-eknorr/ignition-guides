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

The controller and agent coordinate through two ConfigMaps per resource: the controller writes resolved git metadata for the agent to read, and the agent writes its status back for the controller. The synced files themselves never pass through that channel - the agent clones the repo directly into an `emptyDir` and writes into the gateway's data mount, so no shared PVC is required. See the [Stoker operator page](../../tools/stoker-operator.md) for installation, CRD field reference, and webhook receiver setup.

## The GatewaySync Resource

The `GatewaySync` CRD is the primary configuration surface. Each resource targets a specific deployment's pods, names a git source, defines per-gateway **profiles** (source-to-destination path mappings), and optionally applies **patches** to config files (such as setting the gateway system name from a pod variable).

### Worked example: a two-gateway deployment

A single `GatewaySync` can drive both a frontend and a backend gateway via two profiles:

```yaml
apiVersion: stoker.io/v1alpha1
kind: GatewaySync
metadata:
  name: my-ignition-sync
  namespace: my-ignition
spec:
  git:
    repo: "git@github.com:my-org/my-ignition-config.git"
    ref: "2.3.10"    # updated by your promotion pipeline on each release
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
          gatewayName: "my-ignition-fe"
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
          gatewayName: "my-ignition-be"
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
- **Polling as a safety net**: the 5-minute polling interval catches any missed webhook events, but the primary trigger is the Stoker webhook receiver responding to promotion or release events from your pipeline.
- **Exclude patterns** at `sync.defaults` apply to every profile; they prevent Stoker from overwriting runtime-managed files like MQTT Engine tag providers and incoming Gateway Network connections.
- **Patches** on a mapping: the frontend's `dev-us-west-2` mapping patches `systemName` in `ignition/system-properties/config.json` using the pod's ordinal index, producing stable per-pod system names (`my-ignition-fe-0`, `my-ignition-fe-1`, etc.) without duplicating config files.
- **Pod labels** are how the controller finds gateway pods. Pods carry annotations like `stoker.io/inject: "true"` and `stoker.io/cr-name: "my-ignition-sync"` and `stoker.io/profile: "frontend"` so the controller knows which profile to apply to which pod.

### Enabling Stoker per environment

Stoker is disabled by default in the chart's `values.yaml` and enabled per environment via values overlays:

```yaml
# an environment overlay that turns config sync on
stoker:
  enabled: true
  name: my-ignition-sync
```

The git ref that Stoker tracks is updated separately by your promotion pipeline:

```yaml
# region values.yaml (after a promotion)
git:
  ref: 2.3.10
```

### Scaling the pattern

The same `GatewaySync` pattern scales well beyond two gateways. In practice, deployments that span many sites add `knownHosts` to the SSH auth block and use `vars` to template per-site configuration (such as MQTT edge node IDs and system names) across dozens of gateways from a single resource.

## git-sync with API-triggered Scans

git-sync is the established Git-polling approach for environments without the Stoker operator. A git-sync init container continuously polls the application repo and calls the Ignition scan APIs when it detects a new commit hash. Stoker is the newer operator-based approach that does the same job through a `GatewaySync` resource; the git-sync container remains a solid choice where the operator is not installed.

The container runs as a long-lived init container (`restartPolicy: Always`) using the `registry.k8s.io/git-sync/git-sync:v4.6.0` image. On each poll cycle, `sync-entrypoint.sh` runs `git-sync --one-time` to fetch the latest ref, then calls `sync-files.sh` which:

1. Copies projects and config resources from the cloned repo to a staging directory
2. Applies exclude patterns to protect runtime-managed files
3. Normalizes gateway system names in `ignition/system-properties/config.json`
4. Atomically swaps the staging directory into place (delete old, copy new)
5. Calls `POST /data/api/v1/scan/projects` and `POST /data/api/v1/scan/config` to trigger reload

Hash-based change detection (`GITSYNC_HASH` vs a stored hash file) prevents the scan from firing on every poll when nothing has changed.

The git-sync approach requires volumes (`git-secret`, `ignition-api-key-secret`, `git-volume`, `sync-scripts`) mounted into the init container and is more involved to configure than a Stoker `GatewaySync` resource. Prefer Stoker for new deployments where you can install the operator.

## Further Reading

- [Stoker operator page](../../tools/stoker-operator.md): installation, full CRD field reference, webhook receiver, Helm values
- [Stoker upstream docs](https://ia-eknorr.github.io/stoker-operator/): quickstart, installation reference
- [Ignition scan APIs](https://docs.inductiveautomation.com/docs/8.3/): the `/data/api/v1/scan/projects` and `/data/api/v1/scan/config` endpoints that Stoker calls after syncing
