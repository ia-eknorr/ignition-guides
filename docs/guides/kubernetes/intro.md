---
sidebar_position: 1
---

# Running Ignition on Kubernetes

:::tip Before continuing

- The [Containerization guide](../docker/intro.md) is recommended first. The container mental model carries over directly to Kubernetes.
- [Kubernetes Setup](../../getting-started/kubernetes-setup.md) gets you a running cluster and `kubectl` configured.

:::

Kubernetes runs the same `inductiveautomation/ignition` container you already know, but it adds the machinery to schedule that container across a cluster, give it durable storage, reach it over a stable address, and feed it configuration and secrets. This pillar covers the pieces of that machinery that matter for Ignition specifically, and the operational patterns that come up once a gateway is running on a cluster.

The official Helm chart at [charts.ia.io](https://charts.ia.io) assembles most of these resources for you, so these guides focus on the *why* behind the chart's choices and on the integration work the chart leaves to you.

## What's here

- **[Kubernetes concepts for Ignition](./concepts.md)**: the cluster primitives the Helm chart relies on (StatefulSets, PVCs, Services, ConfigMaps, Secrets) and why Ignition needs each one.
- **[External modules from S3](./external-modules-s3.md)**: mount third-party `.modl` files from an S3 bucket into all gateways in the namespace without baking them into pods.
- **[External Secrets](./external-secrets.md)**: wire AWS Secrets Manager (or any provider) to Kubernetes Secrets via the External Secrets Operator, covering the license key, git credentials, and API key.
- **[GitOps with ApplicationSets](./gitops-applicationsets.md)**: use ArgoCD's matrix generator and a `config.yaml` discovery marker to deploy charts across clusters automatically.
- **[Config Sync](./config-sync.md)**: keep Ignition project files and gateway config in sync with Git using the Stoker operator's `GatewaySync` resource.

Short, one-screen operational tips will be collected here under a **Tasks** sub-section as the pillar grows, following the [Kubernetes documentation](https://kubernetes.io/docs/) Concepts / Tasks / Tutorials / Reference convention.

## Related

- [Helm Ignition Lab](../../labs/helm-ignition-lab.md): deploy a gateway on a local cluster end to end.
- [Kubernetes Sizing Reference](../../reference/kubernetes-sizing.md): starting points for CPU, memory, heap, and PVC sizing.
