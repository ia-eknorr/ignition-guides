---
sidebar_position: 2
---

# Helm Chart Essentials

:::tip Before continuing

- [Kubernetes Concepts for Ignition Developers](./concepts.md) explains the primitives the chart wires together.
- [Kubernetes Setup](../../getting-started/kubernetes-setup.md) must be complete - you need a cluster, `kubectl`, and `helm` installed.

:::

The [Ignition Helm Chart docs at charts.ia.io](https://charts.ia.io) are the authoritative reference for every chart value. This page distills the values that matter most for a new Ignition deployment and explains why each one matters for the way Ignition behaves. If a value is not documented here, run `helm show values ignition/ignition` or check [charts.ia.io](https://charts.ia.io) directly.

## The Values That Matter Most

| Value | What it controls | Why it matters for Ignition |
| --- | --- | --- |
| `commissioning.acceptIgnitionEULA` | Accept the Ignition EULA | Required. The chart refuses to install without this set to `true`. |
| `commissioning.edition` | `standard`, `edge`, `cloud`, or `maker` | Edition is fixed at first launch; switching later requires a fresh data volume. |
| `image.tag` | The Ignition version (e.g. `__IGNITION_VERSION__`) | Pin to a specific patch version. Bumping is a coordinated upgrade with database migration; do not let it auto-track latest. |
| `gateway.resources` | CPU and memory requests/limits for the gateway container | Combined with `gateway.maxRAMPercentage`, this drives the JVM heap. See [Kubernetes Sizing Reference](../../reference/kubernetes-sizing.md). |
| `gateway.resourcesEnabled` | Toggle whether the chart sets requests/limits at all | Defaults to `true`. Leave on for any non-trivial deployment so the scheduler can place the pod correctly. |
| `gateway.maxRAMPercentage` | JVM `-XX:MaxRAMPercentage` (heap as percent of container memory) | Default `75`. The JVM also needs metaspace, native buffers, and code cache; leaving 25% off-heap headroom prevents OOM kills. |
| `gateway.dataVolumeStorageSize` | PVC size for `/usr/local/bin/ignition/data` | Default `3Gi` (suitable only for labs). Internal DB, modules, certs, alarm journal. Cannot be resized via `helm upgrade`; pick a sane size up front. |
| `gateway.dataVolumeStorageClass` | StorageClass for the data volume | Defaults to the cluster default. Use performant block storage (e.g. `gp3`); avoid NFS/SMB - they lack the file-locking semantics the internal DB needs. |
| `gateway.gatewayArgs.useProxyForwardedHeader` | Whether the gateway trusts `X-Forwarded-*` headers | Defaults to `true` when ingress is enabled. Same gotcha as the [Docker tier with Traefik](../docker/compose-architecture.md): wrong setting causes `MissingGatewayAddressException` when opening Perspective. |
| `gateway.publicAddress.host` and `.autoDetect` | The address the gateway advertises to clients | Auto-detected when ingress is enabled. Override `host` if your external URL differs from the ingress hostname. |
| `service.type` | `ClusterIP`, `NodePort`, or `LoadBalancer` | ClusterIP for in-cluster GAN; NodePort for local lab access; LoadBalancer for cloud deployments. Default is ClusterIP plus an Ingress. |
| `ingress.enabled` / `ingress.className` / `ingress.domainSuffix` | The ingress resource the chart creates | Defaults create `<release>-ignition.<domainSuffix>` with `domainSuffix: localtest.me`. Set `domainSuffix` for production. |
| `commissioning.auth.adminUsername` / `commissioning.auth.existingSecret` | The initial gateway admin login | The chart generates a random password on first install and stores it in a Secret. Reference your own Secret via `existingSecret` to control the password yourself. |
| `gateway.licensing.leasedActivation.secretName` | Leased (8-character) license key + token from a Secret | Use this for any leased deployment. The Secret holds both the license key and the activation token. See [Licensing Decision Tree](../../reference/licensing-decision-tree.md). |
| `gateway.jvmArgs` | Array of JVM args appended via `wrapper.java.additional_file` | Where leased-license cleanup, custom keystores, and other JVM-level tuning go. |
| `gateway.gatewayArgs` | Map of gateway bootstrap properties | The Kubernetes equivalent of `GATEWAY_SYSTEM_PROPS` from the Docker tier. |
| `gateway.externalModules.enabled` | Mount a separate PVC of third-party modules | Pre-stage third-party modules into a PVC rather than installing through the gateway UI; UI-installed modules do not survive a pod restart the same way they don't survive `down -v` in Docker. |
| `gateway.readinessProbe` (and `livenessProbe`) | When the pod is considered ready/alive | The chart uses an exec-based command (not an HTTP endpoint) that the gateway image's bundled `health-check.sh` resolves. Don't replace this with a raw HTTP probe unless you know what the script does. |

## Resource Collections in the Chart

The Ignition Helm chart supports the same resource collections pattern from the Docker tier (`config/resources/core`, `config/resources/{env}`). Mount them from ConfigMaps or sync them via a git-sync init container; the [Gateway Resource Collections reference](../../reference/resource-collections.md) explains the underlying concept and [charts.ia.io](https://charts.ia.io) documents the specific chart values for wiring them in.

## Further Reading

- [charts.ia.io](https://charts.ia.io) - the authoritative chart docs
- [Kubernetes Concepts for Ignition Developers](./concepts.md) - the primitives behind these values
- [Helm Lab](../../labs/helm-ignition-lab.md) - hands-on with these values
- [Kubernetes Sizing Reference](../../reference/kubernetes-sizing.md) - sizing tables
- [Licensing Decision Tree](../../reference/licensing-decision-tree.md) - Standard vs Leased in containerized deployments
- [Ignition Docker Image Reference](https://docs.inductiveautomation.com/docs/8.3/platform/docker-image) - underlying image used by the chart
