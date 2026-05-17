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

## StatefulSet vs Deployment

A Deployment treats pods as interchangeable. Each pod gets a random name, and rolling updates spin up a new pod before terminating the old one. This works fine for stateless workloads like a web frontend or an API server, where any pod can serve any request.

A StatefulSet gives pods stable identities. The first pod is always `gateway-0`, the second is `gateway-1`. Each pod gets its own persistent volume claim that survives pod restarts and stays bound to that specific pod identity.

Ignition MUST use a StatefulSet. The internal database, license activation, and gateway UUID all live in a persistent volume tied to a specific pod identity. A random pod name with a random volume binding breaks all three.

:::danger Using a Deployment causes data corruption
If you accidentally deploy Ignition as a Deployment with a ReadWriteOnce PVC, a rolling update spins up `gateway-new` while `gateway-old` is still alive. Both pods try to mount the same volume. The internal SQLite database gets concurrent writes, the gateway state becomes inconsistent, and the gateway may not start cleanly. Always use a StatefulSet.
:::

The Ignition Helm chart at charts.ia.io uses a StatefulSet by default, so you do not need to configure this yourself.

## PersistentVolumeClaim and ReadWriteOncePod

The Ignition gateway needs persistent storage for `/usr/local/bin/ignition/data`. In Kubernetes this is a PersistentVolumeClaim (PVC), conceptually the same role as the `ignition-data` named volume in the Docker tier.

Access mode matters. `ReadWriteOnce` (RWO) means one node at a time can mount the volume. `ReadWriteOncePod` (RWOP, Kubernetes 1.22+) means one POD at a time. RWOP is the safer choice for Ignition because it prevents the data corruption scenario above even if the cluster has misconfigured workloads.

The chart's `gateway.dataVolumeStorageSize` value controls PVC size (default `3Gi`, lab-only). Size for the internal database, modules, certs, and logs - not project files (those are typically loaded from a ConfigMap or git-sync at runtime). The [Kubernetes Sizing Reference](../../reference/kubernetes-sizing.md) has starting points by tag count.

## Services and Ingress

A Service gives the gateway a stable internal DNS name. The chart creates one automatically, so other workloads in the cluster can reach the gateway at a predictable address regardless of pod restarts.

For browser access: in production you usually use an Ingress (with TLS via cert-manager); for local development you can use `kubectl port-forward` or the chart's NodePort/LoadBalancer service type.

If you use an Ingress, the gateway must trust forwarded headers (chart value `gateway.gatewayArgs.useProxyForwardedHeader`, default `true` when ingress is enabled). This is the same gotcha as the [Docker tier with Traefik](../docker/compose-architecture.md): mismatched proxy and gateway-advertised address produces a `MissingGatewayAddressException` when opening a Perspective project.

## ConfigMap and Secret

`ConfigMap` holds non-sensitive config: gateway names, ingress hosts, modules to enable. These are plain key/value pairs visible to anyone with read access to the namespace.

`Secret` holds credentials: license activation tokens, database passwords, admin passwords. Secrets are still base64-encoded rather than encrypted at rest by default, so treat them as access-controlled config rather than as vault entries.

Ignition's `_FILE` env var variants let the gateway read values from files mounted from Secrets, which keeps credentials out of pod environment dumps and CI logs.

For the full chart values reference, see the [Ignition Helm Chart docs at charts.ia.io](https://charts.ia.io). The [Helm Chart Essentials](./helm-chart-essentials.md) guide distills the values that matter most for a new deployment, and the [Helm Lab](../../labs/helm-ignition-lab.md) walks through them on a real cluster.
