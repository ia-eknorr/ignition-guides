# Architecture index

The guides on this site are grouped by theme (Containerization, Kubernetes, Observability) because most pages apply to more than one deployment. This page groups them the other way, by platform, with each path ordered start to finish.

There are two platform paths: Kubernetes and Docker Compose.

## Kubernetes

Read the mental model first, then size and deploy a gateway, then add the operational patterns.

1. [Running Ignition on Kubernetes](../guides/kubernetes/intro.md): how the cluster machinery maps onto a gateway.
2. [Kubernetes concepts for Ignition](../guides/kubernetes/concepts.md): the StatefulSet, PVC, Service, and Secret choices behind the Helm chart.
3. [Kubernetes Sizing Reference](./kubernetes-sizing.md): CPU, memory, heap, and PVC starting points.
4. [Helm Ignition Lab](../labs/helm-ignition-lab.md): deploy a gateway on a cluster end to end.
5. [External modules from S3](../guides/kubernetes/external-modules-s3.md): share third-party `.modl` files across gateway pods via a ReadOnlyMany PV.
6. [External Secrets](../guides/kubernetes/external-secrets.md): sync credentials from a cloud secret store into Kubernetes Secrets.
7. [GitOps with ApplicationSets](../guides/kubernetes/gitops-applicationsets.md): automate multi-cluster, multi-environment deployments with ArgoCD matrix generators.
8. [Config Sync](../guides/kubernetes/config-sync.md): keep Ignition project files and gateway config continuously in sync with Git.
9. [Observability for Ignition](../guides/observability/intro.md): what to monitor and how the stack fits together.

:::note Managed and self-hosted clusters use the same path

The route above is identical whether you run a managed cluster (EKS, GKE, AKS) or self-host. The only differences are cloud-specific, such as load balancers, IAM-backed secrets, and storage classes, and those are called out inline in each guide's "On AWS" section as that content lands, not as a separate path to follow.

:::

## Docker Compose

Read the container architecture first, then layer in operations and observability.

1. [Introduction to Docker for Ignition](../guides/docker/intro.md): the container mental model and the project-template architecture.
2. [The Compose Architecture](../guides/docker/compose-architecture.md) and [Volume Strategy](../guides/docker/volume-strategy.md): how the stack is wired and where data lives.
3. [Licensing in Containers](../guides/docker/licensing.md) and [Day-Two Operations](../guides/docker/day-two-operations.md): running a licensed gateway and keeping it healthy.
4. [Docker Ignition Lab](../labs/docker-ignition-lab.md): stand up a gateway from the template.
5. [Observability for Ignition](../guides/observability/intro.md): the observability patterns apply to Compose deployments too.
