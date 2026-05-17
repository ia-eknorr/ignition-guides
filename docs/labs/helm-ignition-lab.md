---
sidebar_position: 3
---

# Helm Lab

## Purpose

By the end of this lab, you will have deployed an Ignition gateway to a local Kubernetes cluster using the official Inductive Automation Helm chart, accessed it via port-forward, verified that the StatefulSet's PersistentVolumeClaim preserves data across pod deletion, and customized the deployment with your own `values.yaml`.

## Before Getting Started

Prerequisites:

- [Docker Lab](./docker-ignition-lab.md) and [Version Control Lab](./version-control-lab.md) completed
- [Workstation Setup](../getting-started/workstation-setup.md) complete (`kubectl` and `helm` installed)
- [Local Kubernetes Setup](../getting-started/kubernetes-setup.md) complete (cluster running, chart repo added)
- Familiarity with the [Helm Chart Essentials](../guides/kubernetes/helm-chart-essentials.md) guide

---

## Step 1: Verify the Cluster

Confirm a local cluster is reachable and the Ignition Helm repo is available.

```shell
kubectl get nodes
helm search repo ignition
```

<Terminal title="bash — ~" lines={[
  "$ kubectl get nodes",
  "NAME                     STATUS   ROLES           AGE   VERSION",
  "helm-lab-control-plane   Ready    control-plane   21s   v1.35.0",
  "",
  "$ helm search repo ignition",
  "NAME                        \tCHART VERSION\tAPP VERSION\tDESCRIPTION",
  "ignition/ignition           \t0.2.3        \t__IGNITION_VERSION__      \tIgnition by Inductive Automation"
]} />

If `kubectl get nodes` does not return a Ready node, revisit the [Local Kubernetes Setup](../getting-started/kubernetes-setup.md) guide before continuing. The chart name shown above (`ignition/ignition`) is what you will install in the next step.

:::note Any local cluster works
Docker Desktop's built-in Kubernetes, `kind`, `minikube`, and `k3d` all behave the same for this lab. Use whichever one you configured during workstation setup.
:::

---

## Step 2: Install the Chart with Defaults

Create a dedicated namespace and install the chart. The chart requires you to accept the Ignition EULA via a values flag.

```shell
kubectl create namespace ignition
helm install my-gw ignition/ignition \
  --namespace ignition \
  --set commissioning.acceptIgnitionEULA=true
```

<Terminal title="bash — ~" lines={[
  "$ kubectl create namespace ignition",
  "namespace/ignition created",
  "",
  "$ helm install my-gw ignition/ignition --namespace ignition --set commissioning.acceptIgnitionEULA=true",
  "NAME: my-gw",
  "LAST DEPLOYED: Sat May 16 15:21:27 2026",
  "NAMESPACE: ignition",
  "STATUS: deployed",
  "REVISION: 1",
  "DESCRIPTION: Install complete",
  "NOTES:",
  "Thank you for installing Ignition __IGNITION_VERSION__ by Inductive Automation!",
  "",
  "Ignition Gateway is reachable at:",
  "  - http://my-gw-ignition.localtest.me",
  "",
  "The initial Ignition Gateway `admin` password can be retrieved with:",
  "",
  "  kubectl get secret -n ignition my-gw-ignition-gateway-admin-password --template='{{ printf \"%s\\n\" (index .data \"gateway-admin-password\" | base64decode) }}'"
]} />

One command produced a StatefulSet, Service, headless DNS, PVC, ConfigMap, and a Secret with the generated admin password. Inspect what landed in the namespace:

```shell
kubectl get statefulset,svc,pvc -n ignition
```

<Terminal title="bash — ~" lines={[
  "$ kubectl get statefulset,svc,pvc -n ignition",
  "NAME                                      READY   AGE",
  "statefulset.apps/my-gw-ignition-gateway   0/1     3s",
  "",
  "NAME                     TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)                      AGE",
  "service/my-gw-ignition   ClusterIP   None         <none>        8060/TCP,8088/TCP,8043/TCP   3s",
  "",
  "NAME                                                  STATUS    CAPACITY   STORAGECLASS",
  "persistentvolumeclaim/data-my-gw-ignition-gateway-0   Pending              standard"
]} />

The service is `my-gw-ignition` (headless, ClusterIP `None`), and the StatefulSet creates pod `my-gw-ignition-gateway-0` with PVC `data-my-gw-ignition-gateway-0`. These names follow the `<release>-<chart>` convention from Helm.

:::tip Retrieve the admin password
Save the password somewhere safe right now. The chart generates a random one on first install and stores it in the Secret named in the post-install notes. If you uninstall the release without deleting that Secret, the password is retained on reinstall.
:::

---

## Step 3: Watch the Pod Start

Stream pod status. Ignition takes 60-180 seconds to start: JVM launch, module loading, and the internal database init all happen before the readiness probe passes.

```shell
kubectl get pods -n ignition -w
```

<Terminal title="bash — ~" lines={[
  "$ kubectl get pods -n ignition -w",
  "NAME                       READY   STATUS     RESTARTS   AGE",
  "my-gw-ignition-gateway-0   0/1     Init:0/1   0          9s",
  "my-gw-ignition-gateway-0   0/1     Init:0/1   0          29s",
  "my-gw-ignition-gateway-0   0/1     Init:0/1   0          60s",
  "my-gw-ignition-gateway-0   0/1     Init:0/1   0          91s",
  "my-gw-ignition-gateway-0   0/1     Running    0          101s",
  "my-gw-ignition-gateway-0   1/1     Running    0          115s"
]} />

Press `Ctrl+C` once you see `1/1 Running`. The `Init:0/1` phase is the `preconfigure` init container the chart uses to prepare the data volume before the main gateway container starts.

:::tip Startup takes a while
The chart's `startupProbe` gives the gateway up to 5 minutes to come up. A standard JVM start plus module loading plus database init takes 60-180 seconds. Be patient: readiness flips to `1/1` only when the gateway answers HTTP.
:::

---

## Step 4: Access the Gateway via Port-Forward

Check the service name, then port-forward `8088` to your workstation.

```shell
kubectl get svc -n ignition
kubectl port-forward -n ignition svc/my-gw-ignition 8088:8088
```

<Terminal title="bash — ~" lines={[
  "$ kubectl get svc -n ignition",
  "NAME             TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)                      AGE",
  "my-gw-ignition   ClusterIP   None         <none>        8060/TCP,8088/TCP,8043/TCP   2m",
  "",
  "$ kubectl port-forward -n ignition svc/my-gw-ignition 8088:8088",
  "Forwarding from 127.0.0.1:8088 -> 8088",
  "Forwarding from [::1]:8088 -> 8088"
]} />

Open [http://localhost:8088](http://localhost:8088) in your browser. The Ignition gateway home page loads. Log in with username `admin` and the password you retrieved in Step 2. This is the same gateway you'd see in the Docker Lab, just running inside Kubernetes.

:::note Port-forward terminates with the terminal
Port-forward is a development-time convenience. Press `Ctrl+C` in the terminal running port-forward to stop it; reopen the connection any time. In production deployments you would use an Ingress or a `LoadBalancer` service type instead.
:::

---

## Step 5: Test Persistence

This is the critical step. You will modify state inside the pod, delete the pod, and confirm the StatefulSet brings it back with the same data attached. This is what makes a StatefulSet correct for Ignition and a Deployment wrong.

### 1. Confirm the data volume mount

In a separate terminal (leave the port-forward running):

```shell
kubectl exec -n ignition my-gw-ignition-gateway-0 -- df -h /usr/local/bin/ignition/data
```

<Terminal title="bash — ~" lines={[
  "$ kubectl exec -n ignition my-gw-ignition-gateway-0 -- df -h /usr/local/bin/ignition/data",
  "Defaulted container \"gateway\" out of: gateway, preconfigure (init)",
  "Filesystem      Size  Used Avail Use% Mounted on",
  "/dev/vda1       453G   35G  395G   9% /usr/local/bin/ignition/data"
]} />

The chart mounts the PVC at `/usr/local/bin/ignition/data`. Anything Ignition writes there - projects, the internal database, tag history, gateway configuration - lives on the PVC, not in the pod's writable layer.

### 2. Create state inside the pod

For the lab, you can either:

- Open the gateway in your browser, launch the Designer, and create a new project named `helm_lab` with a Perspective view named `persistence-test`, or
- Drop a marker file directly into the data volume to prove the mechanic without the Designer round-trip.

The marker-file approach is faster and proves the same thing:

```shell
kubectl exec -n ignition my-gw-ignition-gateway-0 -- \
  sh -c 'echo "persistence-test-$(date +%s)" > /usr/local/bin/ignition/data/persistence-test.txt && cat /usr/local/bin/ignition/data/persistence-test.txt'
```

<Terminal title="bash — ~" lines={[
  "$ kubectl exec -n ignition my-gw-ignition-gateway-0 -- sh -c 'echo \"persistence-test-$(date +%s)\" > /usr/local/bin/ignition/data/persistence-test.txt && cat /usr/local/bin/ignition/data/persistence-test.txt'",
  "Defaulted container \"gateway\" out of: gateway, preconfigure (init)",
  "persistence-test-1778981029"
]} />

Note the timestamp suffix. You will be looking for that same value after the pod is recreated.

### 3. Delete the pod

```shell
kubectl delete pod -n ignition my-gw-ignition-gateway-0
kubectl get pods -n ignition -w
```

<Terminal title="bash — ~" lines={[
  "$ kubectl delete pod -n ignition my-gw-ignition-gateway-0",
  "pod \"my-gw-ignition-gateway-0\" deleted from ignition namespace",
  "",
  "$ kubectl get pods -n ignition -w",
  "NAME                       READY   STATUS    RESTARTS   AGE",
  "my-gw-ignition-gateway-0   0/1     Running   0          5s",
  "my-gw-ignition-gateway-0   1/1     Running   0          115s"
]} />

The StatefulSet controller immediately starts a replacement pod with the **same name** (`my-gw-ignition-gateway-0`) and reattaches the **same PVC** (`data-my-gw-ignition-gateway-0`). Wait for it to be `1/1 Running`, then press `Ctrl+C`.

### 4. Restart port-forward

The original port-forward session died when the pod went away. Start a new one:

```shell
kubectl port-forward -n ignition svc/my-gw-ignition 8088:8088
```

### 5. Verify the data survived

```shell
kubectl exec -n ignition my-gw-ignition-gateway-0 -- cat /usr/local/bin/ignition/data/persistence-test.txt
```

<Terminal title="bash — ~" lines={[
  "$ kubectl exec -n ignition my-gw-ignition-gateway-0 -- cat /usr/local/bin/ignition/data/persistence-test.txt",
  "Defaulted container \"gateway\" out of: gateway, preconfigure (init)",
  "persistence-test-1778981029"
]} />

Same timestamp value. The replacement pod inherited the PVC, and Ignition booted from the existing data directory. If you used the Designer path instead, re-open the gateway and the `helm_lab` project's `persistence-test` view is still there.

:::tip Why StatefulSet, not Deployment
A Deployment treats its pods as interchangeable and will give a replacement pod a new name and a new ephemeral volume. Ignition's data directory contains the internal database, tag history, and project files, so losing it loses the gateway. A StatefulSet pins identity (`-0`, `-1`, ...) and pairs each pod with its own PVC across reschedules. This is the only correct primitive for a stateful gateway.
:::

---

## Step 6: Customize with values.yaml

Production deployments belong in a versioned `values.yaml` file, not on the `--set` command line. Create one alongside your project:

```yaml title="values.yaml"
commissioning:
  acceptIgnitionEULA: true

gateway:
  resources:
    requests:
      cpu: "2"
      memory: 4Gi
    limits:
      cpu: "4"
      memory: 8Gi
```

Then upgrade the release:

```shell
helm upgrade my-gw ignition/ignition --namespace ignition --values values.yaml
```

<Terminal title="bash — ~" lines={[
  "$ helm upgrade my-gw ignition/ignition --namespace ignition --values values.yaml",
  "Release \"my-gw\" has been upgraded. Happy Helming!",
  "NAME: my-gw",
  "LAST DEPLOYED: Sat May 16 15:24:59 2026",
  "NAMESPACE: ignition",
  "STATUS: deployed",
  "REVISION: 2",
  "DESCRIPTION: Upgrade complete"
]} />

Confirm the new resource limits applied to the pod:

```shell
kubectl get pod -n ignition my-gw-ignition-gateway-0 \
  -o jsonpath='{.spec.containers[0].resources}'
```

<Terminal title="bash — ~" lines={[
  "$ kubectl get pod -n ignition my-gw-ignition-gateway-0 -o jsonpath='{.spec.containers[0].resources}'",
  "{\"limits\":{\"cpu\":\"4\",\"memory\":\"8Gi\"},\"requests\":{\"cpu\":\"2\",\"memory\":\"4Gi\"}}"
]} />

The StatefulSet rolled the pod with the new pod spec, and the PVC reattached. Persistence and customization work together.

:::warning You cannot resize the data volume in place
The `gateway.dataVolumeStorageSize` value is fixed at install time. Trying to change it via `helm upgrade` produces a `StatefulSet ... is invalid: spec: Forbidden: updates to statefulset spec for fields other than 'replicas', 'ordinals', 'template', ...` error. Pick a sane size on first install. To grow storage later you either use a CSI driver that supports volume expansion (and patch the PVC directly) or reinstall.
:::

:::note Value paths come from the chart, not from guesswork
Always check `helm show values ignition/ignition` for the real value keys. The exact paths (`gateway.resources`, `commissioning.acceptIgnitionEULA`, `gateway.dataVolumeStorageSize`, and so on) are documented in the chart and at [charts.ia.io](https://charts.ia.io). Helm silently accepts unknown keys, so a typo in `values.yaml` will not error - it will just have no effect.
:::

---

## Step 7: Clean Up

Uninstall the release, then reclaim the PVC and the namespace.

```shell
helm uninstall my-gw --namespace ignition
kubectl get pvc -n ignition
kubectl delete pvc --all --namespace ignition
kubectl delete namespace ignition
```

<Terminal title="bash — ~" lines={[
  "$ helm uninstall my-gw --namespace ignition",
  "release \"my-gw\" uninstalled",
  "",
  "$ kubectl get pvc -n ignition",
  "NAME                            STATUS   CAPACITY   STORAGECLASS   AGE",
  "data-my-gw-ignition-gateway-0   Bound    3Gi        standard       3m41s",
  "",
  "$ kubectl delete pvc --all --namespace ignition",
  "persistentvolumeclaim \"data-my-gw-ignition-gateway-0\" deleted from ignition namespace",
  "",
  "$ kubectl delete namespace ignition",
  "namespace \"ignition\" deleted"
]} />

:::danger helm uninstall does not delete the PVC
By design. The PVC outlives the release so a reinstall reattaches the same data. If you do not delete the PVC explicitly, your storage stays allocated and the next `helm install my-gw ignition/ignition` will reuse the existing data directory (admin password and all). This is great when you want it and a footgun when you don't.
:::

---

## What You Built

You deployed Ignition to Kubernetes with one Helm command, watched the StatefulSet's PVC persist data across a pod deletion, and overrode the chart defaults with your own `values.yaml`. The same workflow scales from a laptop kind cluster to a production EKS or GKE cluster - only the values change.

Where to go next:

- [Helm Chart Essentials](../guides/kubernetes/helm-chart-essentials.md) for deeper coverage of the values keys you used
- [charts.ia.io](https://charts.ia.io) for the full chart reference and every documented value
- Phase 3 content (Local Platform Repo, GitOps with Argo CD, multi-environment promotion) for how this same release moves from one-off `helm install` into a managed delivery pipeline
