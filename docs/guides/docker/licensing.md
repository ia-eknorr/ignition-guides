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

## Trial Mode for Labs

Every lab on this site runs in trial mode. Trial mode gives full functionality for 2 hours; reset it from the gateway's Status page when it expires. No license is required to complete any lab.

## Full Reference

For the complete licensing reference - activation flow, lease check-in intervals, edition selection - see the [Ignition 8.3 Licensing and Activation docs](https://docs.inductiveautomation.com/docs/8.3/platform/licensing-and-activation).
