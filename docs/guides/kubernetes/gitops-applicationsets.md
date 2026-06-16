---
sidebar_position: 5
applies_to: [kubernetes]
---

# GitOps with ArgoCD ApplicationSets

Managing Ignition gateways across multiple environments and regions manually - applying Helm charts, tracking drift, promoting versions - does not scale. ArgoCD ApplicationSets automate this by generating ArgoCD Applications from a matrix of clusters and configuration files. Adding a new region requires no changes to the ApplicationSet itself; you add a config file and the ApplicationSet discovers it.

## How It Works

An [ApplicationSet](https://argo-cd.readthedocs.io/en/stable/user-guide/application-set/) is an ArgoCD resource that generates multiple ArgoCD Applications from a set of generators. A **matrix generator** combines two generators so that every combination of their outputs produces an Application.

A typical platform uses a two-generator matrix:

1. **Cluster generator**: queries the ArgoCD cluster registry for clusters that match a label selector (e.g., `env: prod`)
2. **Git file generator**: scans the deployment repository for files matching a path pattern (e.g., `values/*/prod/<region>/config.yaml`)

Every `(cluster, config-file)` pair produces one ArgoCD Application. The chart name is extracted from the path, the namespace from the `config.yaml` content, and the cluster from the cluster generator output.

```text
clusters matching env=prod   x   values/*/prod/us-west-2/config.yaml
        │                              │
        └──────────────────────────────┘
                         │
               ArgoCD Application per match
```

## The config.yaml Discovery Marker

Each `values/{chart}/{env}/{region}/config.yaml` file is the signal that a chart should deploy to that cluster. The file typically contains only:

```yaml
namespace: my-ignition
```

**Adding a chart to an environment = creating its `config.yaml` in the right path.** The ApplicationSet controller scans for this file on every push to main. When it finds a new one, it creates the corresponding ArgoCD Application. Removing the file does **not** prune the Application: these ApplicationSets run with `applicationsSync: create-update` and `preserveResourcesOnDeletion: true`, so a generated Application is never deleted automatically. This is a deliberate safety choice that prevents an accidental file deletion from tearing down a running gateway; to retire an Application, delete it manually.

In other words, adding a chart to an environment requires only:

1. Create the values directory structure for the chart
2. Add a `config.yaml` in the region directory
3. The ApplicationSet automatically creates an ArgoCD Application

## The Helm Values Layering

Each generated Application mounts three Helm values files, applied in order (later overrides earlier):

```yaml
valueFiles:
  - $values/values/{chart}/common-values.yaml
  - $values/values/{chart}/{env}/environment-values.yaml
  - $values/values/{chart}/{env}/{region}/values.yaml
```

`ignoreMissingValueFiles: true` means any layer that does not exist is skipped silently, so a chart can have only `common-values.yaml` and a region `values.yaml` without an environment layer. This is the 4-layer model described in detail in the [Values Layering reference](../../reference/values-layering.md).

## ApplicationSet Structure

From `appsets/appset-dev.yaml`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: appset-dev
  namespace: argocd
spec:
  goTemplate: true
  goTemplateOptions: ["missingkey=error"]
  generators:
    - matrix:
        generators:
          - clusters:
              selector:
                matchLabels:
                  env: "dev"
                matchExpressions:
                  - key: region
                    operator: In
                    values: ["us-west-2"]
          - git:
              repoURL: git@github.com:my-org/my-ignition-k8s.git
              revision: main
              files:
                - path: values/*/dev/{{ .metadata.labels.region }}/config.yaml
  template:
    metadata:
      name: '{{ index .path.segments 1 }}-{{ .name }}'
    spec:
      project: development
      sources:
        - repoURL: 'git@github.com:my-org/my-ignition-k8s.git'
          path: 'charts/{{ index .path.segments 1 }}'
          targetRevision: main
          helm:
            releaseName: '{{ index .path.segments 1 }}'
            valueFiles:
              - '$values/values/{{ index .path.segments 1 }}/common-values.yaml'
              - '$values/values/{{ index .path.segments 1 }}/dev/environment-values.yaml'
              - '$values/values/{{ index .path.segments 1 }}/dev/{{ .metadata.labels.region }}/values.yaml'
            ignoreMissingValueFiles: true
        - repoURL: 'git@github.com:my-org/my-ignition-k8s.git'
          targetRevision: main
          ref: values
      destination:
        server: '{{ .server }}'
        namespace: '{{ dig "namespace" (index .path.segments 1) . }}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - ServerSideApply=true
          - CreateNamespace=true
```

Key design choices visible here:

- **`goTemplate: true`** with **`missingkey=error`**: uses Go templating for the Application template fields and fails loudly on missing cluster labels rather than silently producing broken Applications
- **Two sources, one `ref`**: the first source fetches the chart from `charts/{chart-name}`, the second fetches the values repo into `$values` so value files can reference it with the `$values` alias
- **`index .path.segments 1`**: extracts the chart name from the `config.yaml` path (segment 1 of `values/{chart}/{env}/{region}/config.yaml`)
- **`CreateNamespace=true`**: ArgoCD creates the namespace automatically; no manual `kubectl create namespace` needed

## Cluster Registration and Labels

Clusters are registered in ArgoCD with labels that the matrix generators use:

```bash
argocd cluster add <context-name> \
  --name my-ignition-<env>-<region> \
  --label env=<env> \
  --label region=<region>
```

The `env` and `region` labels on each registered cluster are the only coupling between the cluster and the ApplicationSet. A prod cluster with `env=prod, region=us-west-2` will receive any chart that has a `values/*/prod/us-west-2/config.yaml`.

## GitOps Flow End to End

1. A developer merges a PR to `main` in the platform repository
2. ArgoCD detects the change (via webhook or poll)
3. ArgoCD re-renders the ApplicationSet, discovering any new or removed `config.yaml` files
4. For each Application, ArgoCD renders the Helm chart with the layered values
5. ArgoCD applies the rendered manifests to the target cluster
6. Self-heal (`selfHeal: true`) corrects any out-of-band changes to cluster state

Application version promotion (updating `git.ref` to point gateways at a new tag of the application repo) is handled by a promotion tool such as [Kargo](https://kargo.io), which writes directly to the platform repository's values files and lets ArgoCD pick up the change through the same GitOps flow.
