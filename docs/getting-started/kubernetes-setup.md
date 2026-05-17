---
sidebar_position: 4
---

# Local Kubernetes Setup

The [Helm Lab](../labs/helm-ignition-lab.md) needs a working Kubernetes cluster on your
machine. This page covers the two recommended ways to get one: Docker Desktop's built-in
Kubernetes (simplest, recommended for most users) and `kind` (a good alternative for
Windows users without Docker Desktop Kubernetes, or anyone who wants more control over
cluster configuration).

:::note Install kubectl and helm first
Both `kubectl` and `helm` are covered in [Workstation Setup](./workstation-setup.md).
Make sure those are installed before continuing.
:::

## Docker Desktop Kubernetes (Recommended)

Docker Desktop ships with a single-node Kubernetes cluster that you can enable with a
checkbox. No extra installation, no extra processes to manage.

1. Open Docker Desktop and click the gear icon to open **Settings**.

2. Go to the **Kubernetes** tab.

3. Check the **Enable Kubernetes** box.

4. Click **Apply & restart**.

5. Wait for the status indicator at the bottom of the Docker Desktop window to show
   Kubernetes is running. First-time enable takes 1-3 minutes while Docker pulls the
   control plane images.

:::tip Already enabled?
If the box is already checked and the status indicator is green, you can skip ahead to
the verification step.
:::

**Verify the cluster is up:**

```shell
kubectl get nodes
```

You should see one node named `docker-desktop` with status `Ready`:

<Terminal title="bash — ~" lines={[
  "$ kubectl get nodes",
  "NAME             STATUS   ROLES           AGE   VERSION",
  "docker-desktop   Ready    control-plane   2m    v1.32.2",
]} />

If the node is not yet `Ready`, give it another minute and try again. The control plane
needs a moment to finish starting after Docker Desktop restarts.

:::warning Resource usage
Enabling Kubernetes increases Docker Desktop's memory and CPU usage. If your machine
feels sluggish, bump Docker Desktop's resource limits under **Settings > Resources**, or
disable Kubernetes when you are not actively using it.
:::

## kind (Alternative)

[kind](https://kind.sigs.k8s.io/) runs a Kubernetes cluster inside Docker containers. It
is a good fit for Windows users without Docker Desktop Kubernetes, or anyone who wants
multiple isolated clusters.

1. Install kind. The [Workstation Setup](./workstation-setup.md) page covers the install
   for macOS, Windows, and direct download.

2. Create a cluster:

   ```shell
   kind create cluster --name ignition-lab
   ```

   First-time cluster creation takes a minute or two while kind pulls its node image.

3. Verify the cluster is running:

   ```shell
   kubectl get nodes
   ```

   You should see one node named `ignition-lab-control-plane` with status `Ready`:

   <Terminal title="bash — ~" lines={[
     "$ kubectl get nodes",
     "NAME                          STATUS   ROLES           AGE   VERSION",
     "ignition-lab-control-plane    Ready    control-plane   45s   v1.32.2",
   ]} />

:::note kind clusters and Docker restarts
kind clusters do not survive a Docker daemon restart cleanly. If you reboot or quit
Docker Desktop, recreate the cluster with the same `kind create cluster` command. Any
resources you had installed in the cluster will need to be reapplied.
:::

**Tear down a kind cluster when you are done:**

```shell
kind delete cluster --name ignition-lab
```

## Add the Ignition Helm Chart Repo

With a cluster running, register the Ignition chart repository so Helm can find and
install charts in the lab.

```shell
helm repo add ignition https://charts.ia.io
helm repo update
```

Verify the repo is registered and the chart index loaded:

```shell
helm search repo ignition
```

<Terminal title="bash — ~" lines={[
  "$ helm search repo ignition",
  "NAME                \tCHART VERSION\tAPP VERSION\tDESCRIPTION",
  "ignition/ignition   \t0.2.3        \t__IGNITION_VERSION__      \tIgnition by Inductive Automation",
]} />

:::tip Authoritative chart reference
The official chart documentation at [charts.ia.io](https://charts.ia.io) is the source of
truth for chart values and usage. ignition-guides provides labs and curated guidance,
not a duplicate of that reference. When in doubt about a specific value, check the chart
docs directly.
:::

## Switching Between Clusters

If you have more than one cluster configured (for example, Docker Desktop Kubernetes and
a kind cluster, or a remote cluster from work), `kubectl` uses **contexts** to track
which one it talks to.

List the contexts available on your machine:

```shell
kubectl config get-contexts
```

Switch to Docker Desktop:

```shell
kubectl config use-context docker-desktop
```

Switch to a kind cluster:

```shell
kubectl config use-context kind-ignition-lab
```

Most users only need one context. If you only have Docker Desktop Kubernetes enabled, or
only a single kind cluster, you can skip this section entirely.

## Next Steps

- [Kubernetes Concepts](../guides/kubernetes/concepts.md): a high-level tour of the
  Kubernetes objects you will see in the lab (StatefulSets, PVCs, Services, and more).
- [Helm Chart Essentials](../guides/kubernetes/helm-chart-essentials.md): the values that
  matter most when installing the official Ignition chart.
- [Helm Lab](../labs/helm-ignition-lab.md): install Ignition into your cluster using the
  official Helm chart.
