---
sidebar_position: 6
---

# Helm Values Layering

A typical platform composes Helm values in four layers to avoid duplication across environments and regions. Each layer overrides the previous. ArgoCD applies them in order using Helm's standard multi-file merge behavior.

## Layer Order

| Layer | File path | Purpose |
| --- | --- | --- |
| 1. Chart defaults | `charts/{chart}/values.yaml` | Shipped with the chart; all keys present with defaults |
| 2. Common values | `values/{chart}/common-values.yaml` | Shared across all environments (observability endpoints, ingress class, etc.) |
| 3. Environment values | `values/{chart}/{env}/environment-values.yaml` | Shared across all regions in one environment (prod vs dev log levels, Stoker on/off, etc.) |
| 4. Region values | `values/{chart}/{env}/{region}/values.yaml` | Region-specific overrides (bucket names, ALB ARNs, hostnames, replicas) |

Layer 1 is implicit - Helm always reads the chart's bundled `values.yaml`. Layers 2-4 are specified in the ApplicationSet's `valueFiles` list.

## valueFiles Order in the ApplicationSet

From `appsets/appset-dev.yaml` (prod and test follow the same pattern):

```yaml
helm:
  valueFiles:
    - $values/values/{{ chart }}/common-values.yaml           # Layer 2
    - $values/values/{{ chart }}/{{ env }}/environment-values.yaml  # Layer 3
    - $values/values/{{ chart }}/{{ env }}/{{ region }}/values.yaml  # Layer 4
  ignoreMissingValueFiles: true
```

`$values` is a second ArgoCD source that points to the same repository revision, providing a stable reference alias for value file paths. `ignoreMissingValueFiles: true` means a missing layer is silently skipped, so a chart can opt into only the layers it needs.

## Concrete Example

For `my-ignition` in `prod/us-west-2`, the composed values are:

```text
charts/my-ignition/values.yaml                           ← Layer 1 (chart defaults)
values/my-ignition/common-values.yaml                    ← Layer 2 (all envs)
values/my-ignition/prod/environment-values.yaml          ← Layer 3 (prod only)
values/my-ignition/prod/us-west-2/values.yaml            ← Layer 4 (this region)
```

A key like `s3Modules.bucketName` is set to `""` in Layer 1 (the chart default), not overridden in Layers 2 or 3 (not applicable cross-region), and set to `ignition-modules-prod` in Layer 4.

A key like `otelInstrumentation.enabled` is set to `false` in Layer 1 and overridden to `true` in Layer 2 (common-values), applying to all environments.

## What Lives in Each Layer

**Common values (Layer 2)** - things that are the same in every environment:

- Ingress annotations that don't vary by region (ALB scheme, health check path, protocol)
- Observability endpoint URIs (OTEL collector service DNS name)
- Stoker annotation labels (pod labels are the same shape everywhere)
- `externalModules.enabled: true` (feature flag, always on)

**Environment values (Layer 3)** - things that differ between prod/test/dev:

- `stoker.enabled` (toggled per environment, for example enabled in development and disabled in production)
- Log level and format (`wrapperArgs`)
- Module enable lists (`GATEWAY_MODULES_ENABLED`)
- OTel environment label (`otelInstrumentation.prometheus.env`)

**Region values (Layer 4)** - things that differ region by region:

- `s3Modules.bucketName` and `s3Modules.region`
- ALB certificate ARN
- External DNS hostname
- `git.ref` (the specific application version deployed here)
- Replica counts and autoscaling triggers

## The config.yaml Discovery Marker

Each `values/{chart}/{env}/{region}/` directory contains a `config.yaml` alongside `values.yaml`. This file is not a Helm values file - it is the ArgoCD ApplicationSet discovery marker. It tells the ApplicationSet that this chart should be deployed to clusters matching the `(env, region)` path.

```yaml
# values/my-ignition/prod/us-west-2/config.yaml
namespace: my-ignition
```

The ApplicationSet's Git file generator scans for files at `values/*/{env}/{region}/config.yaml`. Finding one creates an ArgoCD Application for that chart on that cluster. See [GitOps with ApplicationSets](../guides/kubernetes/gitops-applicationsets.md) for the full ApplicationSet structure.

## Helm Merge Behavior

Helm merges values files with a last-write-wins deep merge. A key set in Layer 3 is overridden by the same key in Layer 4, but a key present only in Layer 2 is not removed by Layer 4 setting other keys at the same depth. Arrays are replaced, not appended - if Layer 3 sets `jvmArgs: ["-Xmx4g"]` and Layer 4 sets `jvmArgs: ["-Xmx8g"]`, the result is `["-Xmx8g"]`, not `["-Xmx4g", "-Xmx8g"]`.
