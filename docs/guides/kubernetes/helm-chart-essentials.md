---
sidebar_position: 2
---

# Helm Chart Essentials

:::tip Before continuing

- [Kubernetes Concepts for Ignition Developers](./concepts.md) explains the primitives the chart wires together.
- [Kubernetes Setup](../../getting-started/kubernetes-setup.md) must be complete - you need a cluster, `kubectl`, and `helm` installed.

:::

The [Ignition Helm Chart docs at charts.ia.io](https://charts.ia.io) are the authoritative reference for every chart value. The values below are the ones you'll commonly reach for when standing up a new deployment, grouped by the phase of the deployment lifecycle they affect. For anything not covered here, `helm show values ignition/ignition` shows the full list, and [charts.ia.io](https://charts.ia.io) has the deep-dive.

## Commonly Configured Values

### Install-time / Commissioning

| Value | What it controls | Why it matters for Ignition |
| --- | --- | --- |
| `commissioning.acceptIgnitionEULA` | Accept the Ignition EULA | Required. The chart refuses to install without this set to `true`. |
| `commissioning.edition` | `standard`, `edge`, `cloud`, or `maker` | Edition is fixed at first launch; switching later requires a fresh data volume. |
| `commissioning.disableQuickstart` | Suppress the Quickstart wizard on first boot | Turn on for non-interactive installs so the gateway comes up clean without waiting on the wizard. |
| `commissioning.auth.adminUsername` / `commissioning.auth.existingSecret` | The initial gateway admin login | Reference a Kubernetes Secret via `existingSecret` instead of putting plain credentials in values. Default behavior generates a random password into a Secret. |
| `image.tag` | The Ignition version (e.g. `__IGNITION_VERSION__`) | Pin to a specific version. Bumping is a coordinated upgrade with database migration; do not let it auto-track latest. |

### Licensing

| Value | What it controls | Why it matters for Ignition |
| --- | --- | --- |
| `gateway.licensing.leasedActivation.secretName` | Reference a Secret holding the leased license key and activation token | The chart supports 8-character leased keys only. 6-character standard keys are not supported by the chart. See [Licensing Decision Tree](../../reference/licensing-decision-tree.md). |
| `gateway.env` / `gateway.envFrom` | General env var injection from Secrets or ConfigMaps | Use this when you need additional license-related env vars beyond what `leasedActivation` configures, or any other Secret-backed env. |

### Compute and Memory

| Value | What it controls | Why it matters for Ignition |
| --- | --- | --- |
| `gateway.resourcesEnabled` | Toggle for whether `gateway.resources` is applied | Defaults to `true`. Leave on for any non-trivial deployment so the scheduler can place the pod correctly. |
| `gateway.resources` | Pod CPU and memory requests and limits | Defaults are 1 CPU / 1.5Gi. See [Kubernetes Sizing](../../reference/kubernetes-sizing.md). |
| `gateway.maxRAMPercentage` | JVM heap as a percentage of the container's memory limit | Default `75`. The JVM also needs off-heap space for metaspace, native libraries, code cache, and direct buffers; never set above `~85`. |

### Storage

| Value | What it controls | Why it matters for Ignition |
| --- | --- | --- |
| `gateway.dataVolumeStorageSize` | PVC size for `/usr/local/bin/ignition/data` | Default `3Gi` (lab-only). Size this for the internal DB, modules, certs, and logs - not project files. |
| `gateway.dataVolumeStorageClass` | StorageClass for the PVC | Default `""` (cluster default). Set explicitly when the cluster has multiple StorageClasses and the wrong one (slow, or with the wrong access mode) is the default. Cannot be changed via `helm upgrade` once the StatefulSet is created. |

### Networking and Exposure

| Value | What it controls | Why it matters for Ignition |
| --- | --- | --- |
| `service.type` | `ClusterIP` (default), `NodePort`, or `LoadBalancer` | ClusterIP for in-cluster GAN; NodePort for kind/lab access; LoadBalancer for cloud deployments with a real load balancer. |
| `ingress.enabled` | Whether to create an Ingress for browser access | Default `true`. |
| `ingress.className` | The IngressClass to use | Default `""` (cluster default). |
| `ingress.domainSuffix` | Hostname suffix for the Ingress | Default `localtest.me` for local development. Set this for production. |
| `gateway.publicAddress.host` / `.autoDetect` | The address Ignition advertises to clients | Auto-detect from the Ingress is the default when ingress is enabled. Must match the actual URL clients use or Perspective sessions fail with `MissingGatewayAddressException` (same gotcha as the [Docker tier with Traefik](../docker/compose-architecture.md)). |
| `gateway.gatewayArgs` | Map of `gateway.*` bootstrap properties | The chart automatically sets `useProxyForwardedHeader=true` when ingress is enabled; this is the place to override it or add other gateway args. |

### Extensibility and Runtime

| Value | What it controls | Why it matters for Ignition |
| --- | --- | --- |
| `gateway.jvmArgs` | Array of JVM arguments passed through to the wrapper | The place to add things like `-Dignition.license.leased-activation-terminate-sessions-on-shutdown=true` for clean lease release on pod shutdown. |
| `gateway.externalModules.enabled` | Enable mounting external `.modl` files into the gateway | The supported way to pre-install third-party modules in Kubernetes. UI-installed modules do not survive a pod restart cleanly. |
| `gateway.readinessProbe` / `gateway.livenessProbe` | Exec-based probe configuration | Defaults are sensible for Ignition's 60-180 second startup; override only with a measured reason. Use `commandOverride: []` to swap the probe command. |
| `extraObjects` | Drop additional raw Kubernetes manifests into the release | Useful for SealedSecrets, NetworkPolicies, or anything not modeled by the chart. |

### Scheduling and Scale

| Value | What it controls | Why it matters for Ignition |
| --- | --- | --- |
| `gateway.replicas` | Pod count | Defaults to `1`. Set explicitly for scale-out scenarios. |
| `gateway.redundancy.enabled` | Enable the chart's redundancy mode (multi-pod failover) | See [charts.ia.io](https://charts.ia.io) for the full redundancy setup. |
| `affinity`, `nodeSelector`, `tolerations` | Standard Kubernetes scheduling controls | Matters for multi-node clusters where you want the gateway pinned to specific nodes (e.g., nodes with SSDs, edge nodes near PLCs). |
| `gateway.gan.outgoingConnections` / `gateway.gan.existingSecret` / `gateway.gan.securityPolicy` | Configure outgoing Gateway Network connections from this gateway to others | Wire up GAN to upstream/downstream gateways without hand-editing the metro keystore. |

## Resource Collections in the Chart

The Ignition Helm chart supports the same resource collections pattern from the Docker tier (`config/resources/core`, `config/resources/{env}`). Mount them from ConfigMaps or sync them via a git-sync init container; the [Gateway Resource Collections reference](../../reference/resource-collections.md) explains the underlying concept and [charts.ia.io](https://charts.ia.io) documents the specific chart values for wiring them in.

## Further Reading

- [charts.ia.io](https://charts.ia.io) - the authoritative chart docs
- [Kubernetes Concepts for Ignition Developers](./concepts.md) - the primitives behind these values
- [Helm Lab](../../labs/helm-ignition-lab.md) - hands-on with these values
- [Kubernetes Sizing Reference](../../reference/kubernetes-sizing.md) - sizing tables
- [Licensing Decision Tree](../../reference/licensing-decision-tree.md) - Standard vs Leased in containerized deployments
- [Ignition Docker Image Reference](https://docs.inductiveautomation.com/docs/8.3/platform/docker-image) - underlying image used by the chart
