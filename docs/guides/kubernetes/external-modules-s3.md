---
sidebar_position: 3
applies_to: [kubernetes]
---

# External Ignition Modules from S3

Ignition modules (`.modl` files) are typically installed directly into a gateway's data directory. In a Kubernetes environment where multiple gateways share the same set of third-party modules, installing modules independently into each pod's PVC means maintaining them in multiple places and replacing pods to update them. The S3 module pattern solves both problems.

## How It Works

The [Ignition Helm chart](https://charts.ia.io) supports an `externalModules` configuration that mounts a PersistentVolume (PV) containing `.modl` files into the gateway pod's modules directory. When gateways share a single PV backed by an S3 bucket:

- The module files live in S3, not inside any pod
- All gateways in the namespace read from the same PV
- Updating a module means uploading a new `.modl` to the bucket - no pod replacement required for the file to become available on the next gateway scan
- The PV access mode is `ReadOnlyMany`, so multiple pods can mount it simultaneously

The chart creates a dedicated PersistentVolume and PersistentVolumeClaim when S3 modules are enabled. The PV uses the AWS Mountpoint S3 CSI Driver (`s3.csi.aws.com`) to map the bucket directly as a filesystem. The PVC name (`s3-modules`) is the shared reference that every gateway sub-chart binds to.

### Backend creates, frontend mounts

In a two-gateway deployment (frontend + backend), one gateway is responsible for creating the PVC (`createOptions.accessMode: ReadOnlyMany`) while the other gateways mount the same PVC by name without creating their own. This is controlled through the `externalModules` values block on each gateway.

From `charts/public-demo/values.yaml`:

```yaml
# Backend creates the PVC with ReadOnlyMany access
backend:
  gateway:
    externalModules:
      enabled: true
      pvcName: s3-modules
      mountReadOnly: false
      createOptions:
        accessMode: ReadOnlyMany
        size: 1Gi
        other:
          storageClassName: ""

# Frontend mounts the same PVC (no createOptions = no PVC creation)
frontend:
  gateway:
    externalModules:
      enabled: true
      pvcName: s3-modules
      mountReadOnly: false
      createOptions: {}
```

The underlying PersistentVolume is rendered by `charts/public-demo/templates/s3-modules-pv.yaml` and binds the `s3-modules` PVC to the bucket:

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: <namespace>-s3-modules
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadOnlyMany
  storageClassName: ""
  claimRef:
    namespace: <namespace>
    name: s3-modules
  mountOptions:
    - region <region>
  csi:
    driver: s3.csi.aws.com
    volumeHandle: <namespace>-s3-modules-vol
    volumeAttributes:
      bucketName: <bucket-name>
```

## On AWS (what we run)

### Prerequisites

The Mountpoint S3 CSI Driver must be installed on the cluster before enabling S3 modules. Verify with:

```bash
kubectl get csidrivers | grep s3
```

### Bucket naming

From `docs/bootstrap.md`, the PublicDemo bucket naming convention is:

```text
pd83-<env>-ignition-modules-<region-short>
```

Examples:

- `pd83-prd-ignition-modules-us` (prod, us-west-2)
- `pd83-dev-ignition-modules-us` (dev, us-west-2)

Create the bucket and configure it in the region's values file:

```bash
aws s3 mb s3://pd83-<env>-ignition-modules-<region-short> --region <region>
```

Then set the values in `values/<chart>/<env>/<region>/values.yaml`:

```yaml
s3Modules:
  enabled: true
  bucketName: pd83-<env>-ignition-modules-<region-short>
  region: <region>
```

The prod US-West-2 region uses `pd83-prd-ignition-modules-us` in `us-west-2`.

### IAM permissions

The CSI driver requires IAM permissions to access the bucket. The Mountpoint S3 CSI Driver documentation describes the required IAM policy and recommended IRSA (IAM Roles for Service Accounts) approach.

## On other platforms and bare-metal

The `s3.csi.aws.com` CSI driver is AWS-specific. On other Kubernetes distributions:

- **GKE**: Use the GCS FUSE CSI driver with a GCS bucket as the backend
- **AKS**: Use the Azure Blob Storage CSI driver
- **Bare-metal / on-premises**: A shared NFS or CephFS volume with `ReadOnlyMany` access achieves the same topology - one writer that places `.modl` files, many readers that mount the same PV

The values structure (`externalModules.pvcName`, `createOptions.accessMode`) is the same regardless of the storage backend. Only the PV spec changes.

## Seen in the wild

The same S3 module pattern with identical `s3-modules-pv.yaml` template appears in the `conf-proveit26-platform` self-hosted deployment, where `proveit-prd-ignition-modules` is the production bucket. That deployment uses the same `s3.csi.aws.com` driver and `ReadOnlyMany` access mode.
