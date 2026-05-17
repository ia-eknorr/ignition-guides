---
sidebar_position: 1
---

# Kubernetes Concepts for Ignition Developers

:::tip Before continuing

- The [Docker tier](../docker/intro.md) is recommended before working through Kubernetes. The mental model carries over directly.
- [Kubernetes Setup](../../getting-started/kubernetes-setup.md) must be complete - you need a running cluster and `kubectl` configured.

:::

The goal of this guide is to prepare you to work with the Ignition Helm chart by covering just the Kubernetes primitives that come up most. It is not a comprehensive Kubernetes guide; for that, the [Kubernetes documentation](https://kubernetes.io/docs/) has everything. What you will get here is enough to follow the chart values, understand the choices behind them, and feel confident customizing your deployment.

The chart at [charts.ia.io](https://charts.ia.io) handles most of these primitives automatically, so you do not need to write any of it yourself. Knowing what is going on underneath still helps when something behaves unexpectedly or when you want to go beyond the defaults.

## From Containers to Pods

You already know containers from the Docker tier: when running Ignition in a container, the gateway process lives inside a container started from the `inductiveautomation/ignition` image (Ignition can also run as a traditional bare-metal install, but containers are what brought you to this guide). Kubernetes abstracts the container one step further with a **pod**.

A pod is the smallest unit Kubernetes manages. In most cases (including Ignition's), a pod is just a wrapper around a single container. You can think of it as a container with extra Kubernetes metadata attached: a name, labels, networking, and lifecycle hooks. When you ask Kubernetes to run Ignition, you are really asking it to run a pod whose container is the Ignition image.

Pods come and go. They can get rescheduled to different nodes, restarted if they crash, or replaced when you change configuration. Anything that needs to live longer than a single pod has to live somewhere else (persistent volumes for data, Services for networking, and so on). The rest of this guide is about those "somewhere else" pieces.

## How Pods Are Managed: Deployments vs StatefulSets

You almost never create a pod directly. Instead, you create a higher-level resource that owns and manages pods for you. The two main options are **Deployments** and **StatefulSets**, and the difference matters a lot for Ignition.

**Deployments** treat pods as interchangeable. Each pod gets a random name like `frontend-7c9bf-x8jhk`, and rolling updates spin up a new pod before terminating the old one. This works great for stateless workloads like a web frontend or an API server, where any pod can handle any request and nothing valuable lives inside the pod itself.

**StatefulSets** give pods stable identities. The first pod is always `gateway-0`, the second is `gateway-1`, and so on. Each pod gets its own persistent volume that stays bound to that specific pod identity. When `gateway-0` restarts, the new pod is still named `gateway-0` and reattaches the same volume.

Ignition has to use a StatefulSet. The internal database, license activation, and gateway UUID all live in a persistent volume tied to a specific pod identity. A random pod name with a random volume binding would break all three.

:::danger Using a Deployment causes data corruption
If you accidentally deploy Ignition as a Deployment with a ReadWriteOnce PVC, a rolling update spins up `gateway-new` while `gateway-old` is still alive. Both pods try to mount the same volume. The internal SQLite database gets concurrent writes, the gateway state becomes inconsistent, and the gateway may not start cleanly. Always use a StatefulSet.
:::

The Ignition Helm chart at charts.ia.io uses a StatefulSet by default, so you do not need to configure this yourself.

## Where Pods Store Data: PersistentVolumeClaim

Pods are ephemeral. If the gateway pod restarts, anything written to its container filesystem is gone. To keep data across pod restarts, the pod mounts a **PersistentVolumeClaim** (PVC). The PVC is conceptually the same role as the `ignition-data` named volume in the Docker tier: it is the durable storage that lives on outside the pod's lifecycle.

The Ignition gateway needs persistent storage for `/usr/local/bin/ignition/data`. The StatefulSet automatically creates a PVC for each pod (so `gateway-0` always gets the same PVC).

**Access modes** control who can mount the PVC at the same time:

- `ReadWriteOnce` (RWO) means one node at a time can mount the volume. Multiple pods on the same node could still race.
- `ReadWriteOncePod` (RWOP, Kubernetes 1.22+) means one POD at a time. This is the safest choice for Ignition because it prevents the data-corruption scenario above even if the cluster has misconfigured workloads.

The chart's `gateway.dataVolumeStorageSize` value controls PVC size (default `3Gi`, lab-only). Size it for the internal database, modules, certs, and logs (not project files, those are typically loaded from a ConfigMap or git-sync at runtime). The [Kubernetes Sizing Reference](../../reference/kubernetes-sizing.md) has starting points by tag count.

## How Pods Are Reached: Services and Ingress

A pod's IP address changes every time it restarts. That makes it useless to point clients at the pod directly. Kubernetes solves this with a **Service**, a stable internal DNS name and virtual IP that always routes to the right pod no matter how many times it restarts. The Ignition chart creates a Service automatically, so other workloads in the cluster can reach the gateway at a predictable address.

For browser access from outside the cluster, you have a few options:

- **`kubectl port-forward`**: easy for local development. Forwards a port on your machine into the cluster. Lives only as long as your terminal stays open. This is what the [Helm Lab](../../labs/helm-ignition-lab.md) uses.
- **NodePort** Service: the cluster exposes the gateway on a port of every node. Fine for kind clusters or simple setups.
- **LoadBalancer** Service: the cluster provisions an external load balancer. Standard for cloud deployments.
- **Ingress**: an HTTP/HTTPS router (with TLS termination via cert-manager). The production-grade option for multi-host setups.

If you use an Ingress, the gateway must trust forwarded headers (chart value `gateway.gatewayArgs.useProxyForwardedHeader`, default `true` when ingress is enabled). This is the same gotcha as the [Docker tier with Traefik](../docker/compose-architecture.md): mismatched proxy and gateway-advertised address produces a `MissingGatewayAddressException` when opening a Perspective project.

## How Pods Get Config: ConfigMaps and Secrets

Pods need configuration: gateway names, ingress hostnames, license keys, admin passwords. You could bake these into the container image, but then changing them requires a rebuild. Kubernetes splits config out into two resources you mount into the pod at runtime.

**ConfigMap** holds non-sensitive config: gateway names, ingress hosts, modules to enable. These are plain key/value pairs visible to anyone with read access to the namespace.

**Secret** holds credentials: license activation tokens, database passwords, admin passwords. Secrets are still base64-encoded rather than encrypted at rest by default, so treat them as access-controlled config rather than as vault entries (cloud secret stores like AWS Secrets Manager or Vault are the next step up).

Ignition's `_FILE` env var variants let the gateway read values from files mounted from Secrets, which keeps credentials out of pod environment dumps and CI logs. The same `IGNITION_ACTIVATION_TOKEN_FILE` pattern from the Docker tier applies here.

## Putting It Together

When you `helm install` the Ignition chart, you are creating a stack of resources at once:

- A **StatefulSet** that manages the gateway pod and gives it a stable identity
- A **PVC** for the gateway's data directory
- A **Service** so other workloads can reach it
- Optionally an **Ingress** for external HTTP/HTTPS access
- **ConfigMaps** and **Secrets** for configuration and credentials

The [Helm Chart Essentials](./helm-chart-essentials.md) guide goes through the chart values that control each of these. The [Helm Lab](../../labs/helm-ignition-lab.md) walks through them on a real cluster. For the full chart reference, see [charts.ia.io](https://charts.ia.io).
