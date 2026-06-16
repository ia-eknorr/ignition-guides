---
applies_to: [docker, kubernetes, bare-metal]
---

# Architecture index

The guides on this site are organized by theme — Containerization, Kubernetes, Observability — rather than by reference architecture, because most pages apply to more than one deployment. This index gives the other view: a curated reading path for readers who know which architecture they run and want a top-to-bottom route through the relevant content.

Every pattern page also carries an **Applies to** badge declaring the deployment contexts it covers, so you can tell at a glance whether a page is relevant to your setup.

## I'm on EKS (or another managed Kubernetes)

Start with the Kubernetes mental model, then size and deploy a gateway, then add observability.

1. [Running Ignition on Kubernetes](../guides/kubernetes/intro.md) — how the cluster machinery maps onto a gateway.
2. [Kubernetes concepts for Ignition](../guides/kubernetes/concepts.md) — the StatefulSet, PVC, Service, and Secret choices behind the Helm chart.
3. [Kubernetes Sizing Reference](./kubernetes-sizing.md) — CPU, memory, heap, and PVC starting points.
4. [Helm Ignition Lab](../labs/helm-ignition-lab.md) — deploy a gateway on a cluster end to end.
5. [Observability for Ignition](../guides/observability/intro.md) — what to monitor and how the stack fits together.

## I'm self-hosting Kubernetes

The same path as managed Kubernetes, minus the cloud load-balancer specifics. The concepts and sizing guidance carry over directly.

1. [Running Ignition on Kubernetes](../guides/kubernetes/intro.md)
2. [Kubernetes concepts for Ignition](../guides/kubernetes/concepts.md)
3. [Kubernetes Sizing Reference](./kubernetes-sizing.md)
4. [Observability for Ignition](../guides/observability/intro.md)

## I'm on Docker

Start with the container architecture, then layer in operations and observability.

1. [Introduction to Docker for Ignition](../guides/docker/intro.md) — the container mental model and the project-template architecture.
2. [The Compose Architecture](../guides/docker/compose-architecture.md) and [Volume Strategy](../guides/docker/volume-strategy.md) — how the stack is wired and where data lives.
3. [Licensing in Containers](../guides/docker/licensing.md) and [Day-Two Operations](../guides/docker/day-two-operations.md) — running a licensed gateway and keeping it healthy.
4. [Docker Ignition Lab](../labs/docker-ignition-lab.md) — stand up a gateway from the template.
5. [Observability for Ignition](../guides/observability/intro.md) — the observability patterns apply to Compose deployments too.
