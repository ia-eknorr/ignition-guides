---
sidebar_position: 5
---

# Licensing Decision Tree

:::tip Before continuing

- For the mechanics of Standard vs Leased in containerized deployments, see the [Docker tier licensing guide](../guides/docker/licensing.md).
- For the full IA reference, see [Licensing and Activation](https://docs.inductiveautomation.com/docs/8.3/platform/licensing-and-activation).

:::

Use the table below to pick between Standard (6-character) and Leased (8-character) licenses based on your deployment context.

## Decision Table

| Scenario | Recommended License | Why |
| --- | --- | --- |
| Local development with internet access | Trial mode or Leased | Trial mode works fine for labs; Leased if you need uninterrupted use |
| CI/CD ephemeral environments | Leased | Ephemeral systems can't keep persistent activation; leased releases on shutdown |
| Cloud / Kubernetes with internet | Leased | The gateway's system identity changes between pod restarts; only Leased survives this cleanly |
| On-premises with internet access | Either | Standard for stability; Leased for flexibility if your fleet changes often |
| Air-gapped / OT network | Standard | Leased licenses revert to trial after 48 hours offline; only Standard works offline indefinitely |
| Edge devices in remote locations | Standard | Same as air-gapped: cannot guarantee connectivity for leased check-in |
| Disaster recovery / failover | Standard or HA-licensed pair | Both nodes need their own license; consider IA's high-availability licensing |

## License Type Comparison

| Property | Standard (6-char) | Leased (8-char) |
| --- | --- | --- |
| Key length | 6 characters | 8 characters |
| System identity | Tied to hardware/volume identity | Token-based; not tied to identity |
| Internet for activation | Required once | Required at activation |
| Internet for runtime | Not required after activation | Required for hourly check-in |
| Offline grace period | Indefinite | 48 hours before reverting to trial |
| Container-friendly | Limited (system identity can change) | Designed for it |
| Reactivation on image update | Often required | Automatic if internet is available |
| Release on shutdown | Not applicable | Strongly recommended (see below) |

## Environment Variables for Containers

Both license types use environment variables in containerized deployments:

```shell
IGNITION_LICENSE_KEY=XXXX-XXXX
IGNITION_ACTIVATION_TOKEN=your-activation-token
```

For Kubernetes Secrets, use the `_FILE` variants to load values from mounted secret files:

```shell
IGNITION_LICENSE_KEY_FILE=/run/secrets/license-key
IGNITION_ACTIVATION_TOKEN_FILE=/run/secrets/activation-token
```

## Releasing Leased Licenses on Container Shutdown

For containerized leased license deployments, configure the gateway to release the lease cleanly when the container stops. Without this, the activation can stay marked active on Inductive Automation's servers, preventing the same key from being used elsewhere until the lease expires.

Pass the property as a JVM argument:

```text
-Dignition.license.leased-activation-terminate-sessions-on-shutdown=true
```

In docker-compose, this goes after the `--` delimiter in the `command` block. In Helm values, append it to the chart's `gateway.jvmArgs` array:

```yaml
gateway:
  jvmArgs:
    - "-Dignition.license.leased-activation-terminate-sessions-on-shutdown=true"
```

For the full leased-licensing wiring (key + token via Secret), see `gateway.licensing.leasedActivation.*` at [charts.ia.io](https://charts.ia.io) and the [Helm Chart Essentials](../guides/kubernetes/helm-chart-essentials.md) guide.

References:

- [Leased Licensing Parameters](https://docs.inductiveautomation.com/docs/8.3/appendix/reference-pages/gateway-configuration-file-reference#leased-licensing-parameters)
- [Docker Image Supplemental JVM Arguments](https://docs.inductiveautomation.com/docs/8.3/platform/docker-image#supplemental-jvm-and-wrapper-arguments)

## Common Pitfalls

- Using a Standard license in Kubernetes and being surprised when pod restarts trigger reactivation requirements
- Forgetting `IGNITION_ACTIVATION_TOKEN` (only the key is not enough for Leased)
- Putting cleartext credentials in a Helm values file instead of using a Secret
- Forgetting to enable lease-release-on-shutdown; orphaned activations accumulate in IA's licensing system
- Trying to use Leased licensing in an air-gapped network and not understanding why the gateway reverts to trial

## Related

- [Licensing in Containers (Docker tier)](../guides/docker/licensing.md)
- [Helm Chart Essentials](../guides/kubernetes/helm-chart-essentials.md)
- [Kubernetes Sizing Reference](./kubernetes-sizing.md)
- [Ignition Licensing and Activation docs](https://docs.inductiveautomation.com/docs/8.3/platform/licensing-and-activation)
