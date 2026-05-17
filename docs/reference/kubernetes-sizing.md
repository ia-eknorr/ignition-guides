---
sidebar_position: 4
---

# Kubernetes Resource Sizing for Ignition

:::tip Before continuing

- [Helm Chart Essentials](../guides/kubernetes/helm-chart-essentials.md) covers the value keys this page references.
- For the general Ignition sizing model, see the [Ignition Server Sizing and Architecture Guide](https://inductiveautomation.com/resources/article/ignition-server-sizing-and-architecture-guide).

:::

Sizing depends on tag count, history rate, project complexity, and module load. The tables below are starting points for development and small production deployments. Production sizing requires load testing against representative workloads.

## Gateway Resource Sizing

| Profile | Tags (approximate) | CPU requests | CPU limits | Memory requests | Memory limits |
| --- | --- | --- | --- | --- | --- |
| Small (dev/test) | `< 10k` | `1` | `2` | `2Gi` | `4Gi` |
| Medium | `10k-50k` | `2` | `4` | `4Gi` | `8Gi` |
| Large | `50k-200k` | `4` | `8` | `8Gi` | `16Gi` |
| Extra Large | `> 200k` | `8` | `16` | `16Gi` | `32Gi` |

The chart sets the JVM heap automatically from the container memory limit via `gateway.maxRAMPercentage` (default `75`). The JVM also needs space for metaspace, native libraries, code cache, and direct buffers; keeping ~25% of the memory limit off-heap prevents the JVM from being OOM-killed by the kernel under load. Override `gateway.maxRAMPercentage` only if you have measured a reason to, and never set it above ~85% on a container with a hard memory limit.

## Helm Chart Values

The sizing table above maps to the chart's `gateway.resources` field:

```yaml
gateway:
  resourcesEnabled: true
  resources:
    requests:
      cpu: "2"
      memory: 4Gi
    limits:
      cpu: "4"
      memory: 8Gi
  maxRAMPercentage: 75
```

See [charts.ia.io](https://charts.ia.io) and the [Helm Chart Essentials](../guides/kubernetes/helm-chart-essentials.md) guide for the full set of related values.

## Data Volume Sizing

The chart's `gateway.dataVolumeStorageSize` sets the PVC size for `/usr/local/bin/ignition/data`. The default is `3Gi`, which is only suitable for short-lived lab clusters.

| Profile | `gateway.dataVolumeStorageSize` | What's stored |
| --- | --- | --- |
| Small (dev/test) | `10Gi` | Internal DB, modules, certs. No significant tag history. |
| Medium | `50Gi` | Above plus alarm journal and short-term tag history. |
| Large with history | `200Gi+` | Above plus tag history database if not externalized. |
| Production with external history DB | `50Gi` | Tag history offloaded to a dedicated database; PVC holds only internal state. |

Tag history is best stored in an external database (PostgreSQL, MSSQL) for any production deployment, not in the gateway's internal database.

:::warning Data volume cannot be resized in place
`gateway.dataVolumeStorageSize` is baked into the StatefulSet's `volumeClaimTemplates` at install time. `helm upgrade` cannot change it - the API server rejects the StatefulSet update. To grow storage later you either use a CSI driver that supports volume expansion (and patch the PVC directly) or reinstall. Pick a generous size up front. The [Helm Lab](../labs/helm-ignition-lab.md) demonstrates this limitation.
:::

## Probe Configuration

The chart configures readiness, liveness, and startup behavior using an exec-based command (the gateway image's bundled `health-check.sh`), not a raw HTTP probe. The defaults are sensible for Ignition's 60-180 second startup and you typically should not override them.

```yaml
gateway:
  readinessProbe:
    initialDelaySeconds: 10
    periodSeconds: 5
    failureThreshold: 2
    timeoutSeconds: 3
```

Override the exec command itself with `gateway.readinessProbe.commandOverride` only if you have a specific reason; raw HTTP probes against the gateway can produce false negatives during slow startup or when the gateway is mid-restart. See [charts.ia.io](https://charts.ia.io) for the current default command.

## Related

- [charts.ia.io](https://charts.ia.io) - authoritative chart reference
- [Helm Chart Essentials](../guides/kubernetes/helm-chart-essentials.md) - the values that drive sizing
- [Helm Lab](../labs/helm-ignition-lab.md) - hands-on sizing override
- [Ignition Server Sizing and Architecture Guide](https://inductiveautomation.com/resources/article/ignition-server-sizing-and-architecture-guide) - IA's general sizing model
