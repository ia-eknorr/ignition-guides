---
sidebar_position: 4
---

# Licensing in Containers

:::tip Before continuing
Read [The Compose Architecture](./compose-architecture.md) before this page.
:::

Ignition licensing works the same way in Docker as on bare metal: the gateway checks in with Inductive Automation's servers and stores activation state locally. What changes in Docker is where that state is stored and what counts as the "system identity" the license is tied to. Getting this wrong means losing your license activation every time you update the image.

### License types

**Standard license (6-character key):**

- Tied to a "system identity" computed from hardware characteristics
- In Docker, this identity is derived from the `ignition-data` named volume contents - not the host machine hardware
- Activated online once, then works offline indefinitely
- The license persists across container restarts and image updates as long as the named volume is preserved
- `docker compose down -v` deletes the volume and the license activation - the gateway will be in trial mode on next start
- Changing to a new image tag (e.g., `8.3.6` to `8.3.7`) can change the system identity and invalidate the license, requiring reactivation

**Leased license (8-character key):**

- Designed for dynamic environments like containers and cloud deployments
- Checks in with IA servers every hour to renew the lease
- If the gateway cannot reach IA's servers for 48 hours, it reverts to trial mode automatically
- Not suitable for air-gapped or offline networks
- Passed to the container as environment variables (see below)
- Does not depend on system identity - the license follows the activation token, not the hardware

### Decision tree

| Scenario | Recommended license type |
| --- | --- |
| Local development with internet access | Either - trial mode works fine for labs |
| Cloud or Kubernetes deployment with internet | Leased (8-char) |
| On-premises server with internet access | Either - standard for stability |
| Air-gapped or OT network | Standard (6-char) only - activate once, then offline |
| CI/CD or ephemeral containers | Leased, or trial mode if testing only |

### Environment variables

Leased licenses are passed to the container as environment variables. Add these to your `.env` file:

```text
IGNITION_LICENSE_KEY=XXXX-XXXX
IGNITION_ACTIVATION_TOKEN=your-activation-token
```

:::warning
Never commit your `.env` file. It should be listed in `.gitignore`. Your license key and activation token are credentials.
:::

For Kubernetes secrets - covered in the Orchestration pathway - use the `_FILE` variant to load credentials from a mounted secret:

```text
IGNITION_LICENSE_KEY_FILE=/run/secrets/license-key
IGNITION_ACTIVATION_TOKEN_FILE=/run/secrets/activation-token
```

### What happens on image upgrade

:::warning License reactivation after upgrades
When you change the Ignition image tag in `docker-compose.yml` (e.g., from `8.3.6` to `8.3.7`), run `docker compose down -v` before `docker compose up`. Starting fresh avoids state incompatibilities between versions.

For standard licenses: the new volume will have a new system identity. You will need to reactivate. Have your license key available before upgrading.

For leased licenses: they are not tied to system identity, so they reactivate automatically on first start as long as internet access is available.

Never run `docker compose up` with a new image tag against an existing volume from a different major version.
:::

### Air-gapped reality

:::note Air-gapped deployments
There is no Inductive Automation on-premises license server. If your network has no outbound internet access:

- Standard licenses can be activated once online, then operate offline indefinitely
- Leased licenses will revert to trial mode after 48 hours offline - they are not suitable for air-gapped environments
- If initial online activation is not possible, contact Inductive Automation for offline activation procedures

The Orchestration pathway covers air-gapped Kubernetes deployments in detail.
:::

### Trial mode in labs

All labs on this site use Ignition's built-in trial mode. Trial mode gives full functionality for 2 hours. When the trial expires, reset it from the gateway's status page and continue. No license key is required to complete any lab.
