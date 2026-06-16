---
sidebar_position: 4
applies_to: [kubernetes]
---

# External Secrets for Ignition on Kubernetes

Kubernetes Secrets are base64-encoded, not encrypted at rest by default, and have no built-in rotation. Cloud secret stores (AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault) provide encryption, rotation policies, and fine-grained access control. The [External Secrets Operator](https://external-secrets.io) bridges the gap: it reads from your cloud store and writes the result into ordinary Kubernetes Secrets that pods consume normally.

:::note Provider-specific examples

Examples use AWS Secrets Manager via IRSA. The External Secrets Operator supports other providers (GCP Secret Manager, Azure Key Vault, HashiCorp Vault) with the same `ExternalSecret` shape.

:::

For Ignition specifically, the secrets that need this treatment are:

- **License activation** - the license key and activation token that Ignition reads at startup (see [Licensing](https://docs.inductiveautomation.com/docs/8.3/platform/licensing-and-activation) for the activation model)
- **Git credentials** - the SSH key the git-sync sidecar uses to clone the application repo
- **Ignition API key** - the bearer token [Stoker](./config-sync.md) and git-sync use to call the gateway's REST API
- **Gateway admin password** - the initial admin credential set during commissioning

## How It Works

Two resources coordinate the sync:

**ClusterSecretStore** is a cluster-scoped resource that authenticates once to the external provider and makes that connection available to all namespaces. You configure it with IAM credentials, a service account annotation (IRSA), or a static API token depending on the provider.

**ExternalSecret** is a namespace-scoped resource that says "pull these specific properties from this store and write them into a Kubernetes Secret named X." The controller reconciles on a schedule (`refreshInterval`) and any time the ExternalSecret spec changes.

```text
ClusterSecretStore ──authenticates──► Secret Manager
        │
ExternalSecret ──references──► ClusterSecretStore
        │
        ▼ (reconcile)
Kubernetes Secret (consumed by pods normally)
```

## Wiring the secret store

### ClusterSecretStore with IRSA

Define a `ClusterSecretStore` backed by your secret manager, authenticated via IRSA (IAM Roles for Service Accounts). The External Secrets Operator service account carries the IAM role annotation; the CRD itself only specifies the service and region:

```yaml
apiVersion: external-secrets.io/v1
kind: ClusterSecretStore
metadata:
  name: ignition
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-west-2
```

The IRSA binding lives in the cluster's IAM configuration, not in this resource.

### ExternalSecrets in the Helm chart

The chart creates four ExternalSecrets. All four read distinct JSON properties from a single secret in your secret manager (here `ignition-secrets`), each extracting one property via `property:` into its own Kubernetes Secret.

**Git credentials** (two keys from one stored secret):

```yaml
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: git-sync-secret
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: ignition
    kind: ClusterSecretStore
  target:
    name: git-sync-secret
    creationPolicy: Owner
  data:
  - secretKey: ssh
    remoteRef:
      key: ignition-secrets
      property: GIT_SYNC_SSH
  - secretKey: known_hosts
    remoteRef:
      key: ignition-secrets
      property: GIT_SYNC_KNOWN_HOSTS
```

The resulting `git-sync-secret` Kubernetes Secret is mounted into the git-sync init container at `/etc/git-secret`, with `ssh` and `known_hosts` keys matching what `git` expects.

**Ignition API key** (used by Stoker and git-sync to call the gateway):

```yaml
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: ignition-api-key
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: ignition
    kind: ClusterSecretStore
  target:
    name: ignition-api-key
    creationPolicy: Owner
  data:
  - secretKey: apiKey
    remoteRef:
      key: ignition-secrets
      property: IGNITION_API_KEY
```

**Leased license** (the license key and activation token for Ignition's leased activation model):

```yaml
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: ignition-leased-license
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: ignition
    kind: ClusterSecretStore
  target:
    name: ignition-leased-license
    creationPolicy: Owner
  data:
  - secretKey: ignition-license-key
    remoteRef:
      key: ignition-secrets
      property: IGNITION_LICENSE_KEY
  - secretKey: ignition-activation-token
    remoteRef:
      key: ignition-secrets
      property: IGNITION_ACTIVATION_TOKEN
```

The `ignition-leased-license` Secret is referenced by the gateway values:

```yaml
frontend:
  gateway:
    licensing:
      leasedActivation:
        secretName: "ignition-leased-license"
```

The chart values that control the ExternalSecret configuration live at the top level:

```yaml
externalSecrets:
  secretName: "ignition-secrets"        # the secret name in your secret manager
  clusterSecretStore: "ignition"         # which ClusterSecretStore to use
  refreshInterval: "1h"
```

All ExternalSecret templates read from `externalSecrets.secretName`, so switching to a different backing secret is a single values override.

### Sync wave ordering

All four ExternalSecrets carry `argocd.argoproj.io/sync-wave: "0"`, ensuring they sync after the ClusterSecretStore (wave `-1`) but before gateways come up. The Kubernetes Secrets exist by the time gateway pods first start.

## On other platforms

The External Secrets Operator supports many providers beyond AWS Secrets Manager, including GCP Secret Manager, Azure Key Vault, and HashiCorp Vault. The `ClusterSecretStore` spec's `provider` block changes; the `ExternalSecret` structure and the pod consumption pattern are identical across providers.

On bare-metal clusters without a cloud secret store, [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets) or [SOPS](https://github.com/getsops/sops) are common alternatives that encrypt secrets for Git storage.

## Further reading

- [External Secrets Operator documentation](https://external-secrets.io/latest/)
- [Ignition leased licensing](https://docs.inductiveautomation.com/docs/8.3/platform/licensing-and-activation)
