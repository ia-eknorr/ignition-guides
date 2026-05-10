---
sidebar_position: 2
---

# Gateway Resource Collections

Ignition 8.3 organizes gateway configuration through a hierarchy of resource collections. Understanding this hierarchy is essential for knowing what to track in Git, what to ignore, and how to handle multiple environments.

For the official reference, see [Gateway Deployment Modes](https://docs.inductiveautomation.com/docs/8.3/platform/gateway/web-interface/platform/gateway-deployment-modes).

## Collection Hierarchy

```text
system → external → core → deployment-mode → local
```

Resources defined in lower collections (right side) override resources with the same name from higher collections (left side).

### System

Built-in, immutable resources provided by Ignition (default JDBC drivers, system config). Cannot be modified directly, but can be overridden in lower collections.

### External

Read-only resources managed outside the Gateway UI - typically version-controlled files. Use external for:

- Settings that operators should not be able to change through the Gateway web interface
- Shared configurations used by multiple gateways
- Centrally managed base configurations

Changes must be made in source files and reloaded rather than through the UI.

### Core

The default working collection. Core resources:

- Are editable through the Gateway web interface
- Inherit from external (and system)
- Provide the base configuration for all deployment modes
- Must contain all singleton resources, even if overridden in deployment modes

### Deployment Modes

User-defined collections for environment-specific configuration. Each deployment mode:

- Inherits from core by default
- Contains environment-specific overrides and additions
- Is activated by setting the `DEPLOYMENT_MODE` environment variable

The `project-template` uses `dev` as its deployment mode, set via `DEPLOYMENT_MODE=dev` in `.env.example`.

### Local

Host-specific data that should not be shared (certificates, local secrets). Not inherited by deployment modes and not version controlled.

## Resource Types

### Named Resources

Individual items that appear in lists - you can have zero, one, or many of them:

| Resource Type | Example Names |
| --- | --- |
| Database connections | `production`, `dev-db`, `historian` |
| Tag providers | `default`, `edge-devices` |
| Alarm journals | `main-journal` |
| User sources | `internal`, `ldap-prod` |
| Gateway network connections | `backend-gw` |
| Identity providers | `default`, `sso-prod` |

Named resources can exist only in specific collections, or override a parent collection's resource of the same name.

### Singleton Resources

Single configuration objects - exactly one per gateway:

| Singleton Resource | Description |
| --- | --- |
| `gateway-network-settings` | Global gateway network configuration |
| `system-properties` | Gateway system properties |
| `security-properties` | Security settings |
| `security-levels` | Security level definitions |
| `general-alarm-settings` | Global alarm configuration |

:::warning
All singleton resources **must exist in core** (or external), even if you override them in a deployment mode. The gateway needs a base configuration to start with. A singleton that exists only in a deployment mode will cause the gateway to fail to start.
:::

## What Goes Where

### Core

Place resources in `core` when they are identical across all environments:

| Resource Type | Examples |
| --- | --- |
| Perspective session properties | Theme, general UI settings |
| OPC-UA settings | Connections to local simulators |
| Module configurations | Settings without external endpoints |
| Tag definitions | UDT definitions, tag types |
| Translations | Localization files |
| Singleton base configs | `gateway-network-settings`, `system-properties` |

### Deployment Modes

Place resources in a deployment mode when they contain environment-specific values:

| Resource Type | Why It Varies |
| --- | --- |
| Database connections | Different hosts or credentials per environment |
| Remote tag providers | Point to different backend gateways |
| Alarm journals | Write to different databases |
| Gateway network connections | Different backend addresses per environment |
| Identity providers | Different IdP configs (dev vs prod SSO) |
| User sources | Different user databases or LDAP servers |

:::tip
If a resource contains a hostname, IP address, connection string, or credentials, it belongs in a deployment mode rather than core.
:::

## Directory Structure

```text
services/ignition/config/resources/
├── core/                           # Shared across all modes
│   ├── config-mode.json
│   ├── ignition/
│   │   ├── gateway-network-settings/   # Singleton - must be here
│   │   ├── system-properties/
│   │   └── tag-provider/default/
│   └── com.inductiveautomation.perspective/
│       └── session-props/
├── dev/                            # Local development overrides
│   ├── config-mode.json
│   └── ignition/
│       ├── database-connection/
│       └── system-properties/      # Overrides core
└── prod/                           # Production overrides
    ├── config-mode.json
    └── ignition/
        ├── database-connection/    # Different host/credentials
        └── system-properties/
```

The `project-template` mounts `core/` and `dev/` into the container. Both directories are tracked in Git.

## config-mode.json

Every collection directory requires a `config-mode.json` file:

**Core:**
```json
{
  "title": "Core",
  "description": "Core collection of gateway configuration resources",
  "enabled": true,
  "inheritable": true,
  "parent": "external"
}
```

**Deployment mode:**
```json
{
  "title": "Dev",
  "description": "Local development environment",
  "enabled": true,
  "inheritable": true,
  "parent": "core"
}
```

| Field | Description |
| --- | --- |
| `title` | Display name shown in the Gateway web interface |
| `description` | Optional description |
| `enabled` | Whether this collection is active |
| `inheritable` | Whether other collections can inherit from this one |
| `parent` | Parent collection (`system`, `external`, `core`, or another mode name) |

## Setting Up a Deployment Mode

1. Create the directory:

    ```shell
    mkdir -p services/ignition/config/resources/prod/ignition
    ```

2. Create `config-mode.json`:

    ```json
    {
      "title": "Production",
      "description": "",
      "enabled": true,
      "inheritable": true,
      "parent": "core"
    }
    ```

3. Add environment-specific resources.

4. Activate by setting `DEPLOYMENT_MODE=prod` in `.env` and restarting:

    ```shell
    docker compose down && docker compose up -d
    ```

## Common Patterns

### Single Environment (project-template default)

The simplest setup - `core` for shared config, `dev` for anything local:

```text
config/resources/
├── core/
└── dev/
```

### Multi-Environment

For projects that deploy to dev, test, and production:

```text
config/resources/
├── core/       # Shared application config
├── dev/        # Local development (localhost DBs, relaxed security)
├── test/       # QA environment
└── prod/       # Production (production DBs, full security)
```

### Multi-Region Production

For multi-region deployments:

```text
config/resources/
├── core/
├── dev/
├── prod-us-east/
├── prod-eu-central/
└── prod-ap-southeast/
```

Each region has its own database connections and gateway network connections pointing to regional infrastructure.

## FAQ

**What's the difference between external and core?**
External is read-only via the Gateway UI - changes must come from files. Core is editable through the web interface. Use external when you want to prevent operators from accidentally changing a setting.

**Can I use deployment modes without an external collection?**
Yes. External is optional. Most simple projects just use `core` and one or more deployment modes.

**Can a named resource exist only in a deployment mode?**
Yes. Database connections, tag providers, and other named resources can exist in a single mode with no corresponding entry in core.

**Can a singleton resource exist only in a deployment mode?**
No. Singletons like `gateway-network-settings` and `system-properties` must exist in `core` or `external` first. Deployment modes can override them but not create them from scratch.

**How do I reload resources without restarting the gateway?**
Use the "Scan File System" option in the Gateway web interface under Config, or via the API:

```shell
curl -X POST http://localhost:8088/data/api/v1/scan/config
```
