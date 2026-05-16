---
sidebar_position: 4
---

# Licensing in Containers

:::tip Before continuing
Read [The Compose Architecture](./compose-architecture.md) before this page.
:::

For anything running in a container, use an 8-character leased license. Leased licenses are designed for dynamic environments where the gateway's system identity changes between restarts, image upgrades, and volume resets - all of which happen frequently with Docker.

Standard 6-character keys are tied to a system identity computed from the named volume contents, so a `docker compose down -v` or an image upgrade can invalidate the activation and require manual reactivation. Leased keys avoid this entirely.

## Passing the License to the Container

Add these to your `.env` file:

```text
IGNITION_LICENSE_KEY=XXXX-XXXX
IGNITION_ACTIVATION_TOKEN=your-activation-token
```

:::warning
`.env` is listed in `.gitignore` for a reason. Never commit it - your license key and activation token are credentials.
:::

For Kubernetes Secrets (covered in the Orchestration pathway), use the `_FILE` variant to load values from a mounted secret instead of plain env vars.

## Release the Lease on Shutdown

Leased activations are tracked server-side. If a container stops without releasing its lease, the activation can stay marked active on Inductive Automation's servers, preventing the same key from being used elsewhere until the lease expires. For Docker, where containers stop and start frequently, configure the gateway to release the lease cleanly on shutdown.

Pass the property as a JVM argument after the `--` delimiter in your `command:` block in `docker-compose.yml`:

```yaml
command: >
  -n ${GATEWAY_NAME}
  -m 4096
  -h 80
  -s 443
  -a ${GATEWAY_NAME}.localtest.me
  --
  -Dignition.license.leased-activation-terminate-sessions-on-shutdown=true
```

References:

- [Leased Licensing Parameters](https://docs.inductiveautomation.com/docs/8.3/appendix/reference-pages/gateway-configuration-file-reference#leased-licensing-parameters) - the exact property and related timeout settings
- [Supplemental JVM and Wrapper Arguments](https://docs.inductiveautomation.com/docs/8.3/platform/docker-image#supplemental-jvm-and-wrapper-arguments) - how the `--` delimiter passes JVM args to the gateway

## Trial Mode for Labs

Every lab on this site runs in trial mode. Trial mode gives full functionality for 2 hours; reset it from the gateway's Status page when it expires. No license is required to complete any lab.

## Full Reference

For the complete licensing reference - activation flow, lease check-in intervals, edition selection - see the [Ignition 8.3 Licensing and Activation docs](https://docs.inductiveautomation.com/docs/8.3/platform/licensing-and-activation).
