---
sidebar_position: 1
---

# Introduction to Docker for Ignition

:::tip Before continuing
- [Workstation Setup](../../getting-started/workstation-setup.md) must be complete - Docker Desktop must be installed and running.
- Familiarity with the [Version Control guide](../version-control/intro.md) is helpful but not required.
:::

Docker changes how you install, run, and share Ignition gateways. Instead of running an installer on your workstation and managing a system service, you declare a gateway in a compose file and start it with a single command. This guide explains the concepts you need before working with the `ia-eknorr/project-template`.

## What Docker Solves for Ignition Developers

The most immediate benefit is running multiple Ignition versions simultaneously. If you support a client on 8.3.4 and another on 8.3.6, you can run both gateways on the same machine without any manual installer switching. Each gateway lives in its own container, on its own ports, behind its own Traefik route.

Beyond version isolation, Docker gives every developer on a project an identical environment. The gateway a new team member starts on day one behaves the same as the one that has been running in a CI pipeline for six months. There is no "works on my machine" because the image and compose configuration define the environment completely.

Networking between multiple gateways is handled by Traefik, the reverse proxy that routes `*.localtest.me` hostnames to the correct container. Each gateway gets a clean URL without port numbers - no more remembering whether the staging gateway is on port 8088 or 8089.

Teardown and reset are also cleaner. Removing a gateway installed on a host requires uninstalling the service, deleting leftover files across several system directories, and sometimes rebooting. With Docker, `docker compose down -v` removes the containers and their volumes in seconds, and `docker compose up` starts fresh. Nothing persists on the host.

## Containers vs. VMs: the Ignition Mental Model

A virtual machine runs a complete operating system on top of a hypervisor. Starting a VM means booting a kernel, initializing services, and waiting for a full OS to come up - this is why Ignition VMs can take minutes to reach the gateway login screen.

A container shares the host OS kernel. There is no second operating system to boot. The Ignition process inside a container starts the same Java runtime on the same kernel as everything else on your machine. Gateway startup time drops from minutes to seconds.

From Ignition's perspective, nothing has changed. The gateway process runs exactly as it would on a Linux server - same Java runtime, same port bindings, same file paths. The gateway does not know or care that it is inside a container. The web interface is at port 8088, the modules load from the same paths, and scripting functions behave identically.

The critical difference is filesystem lifetime. Everything written inside a container's filesystem is discarded when the container stops, unless it was written to a volume or bind mount. A fresh container is a fresh slate. For Ignition this matters a great deal - the gateway's internal database, installed modules, and license activation would all disappear between restarts if not explicitly configured to persist. The next section explains how volumes and bind mounts solve this.

## Named Volumes vs. Bind Mounts: Why Ignition Needs Both

Ignition's data falls into two categories that require different persistence strategies.

A named volume is a storage area that Docker manages on your host filesystem at a path Docker controls. You give it a name (`ignition-data`) and Docker handles the rest. Named volumes are the right tool for Ignition's runtime state: the internal database, installed modules, certificates, and license activation. This data needs to survive container restarts, but you do not want it in Git. You do not edit the internal database directly and you do not want license activation files tracked in version control. Docker manages the path; you treat it as a black box that keeps Ignition running across restarts.

A bind mount maps a specific directory on your machine into the container at a specific path. The directory exists on your machine, Git tracks it, and Docker makes it visible inside the container at runtime. This is how Git-tracked project files and gateway configuration get into the gateway. Your `services/ignition/projects/` directory on disk appears inside the container at the path Ignition reads projects from. When you edit a project file in your editor, Ignition sees the change immediately because it is reading from the same directory.

Ignition needs both because the two categories of data have fundamentally different requirements. Runtime state should persist but must not be in Git. Project files and gateway configuration must be in Git but do not need Docker to manage their path. Named volumes cover the first category; bind mounts cover the second.

## The Official `inductiveautomation/ignition` Image

Inductive Automation publishes official Docker images at `inductiveautomation/ignition` on Docker Hub. Images are tagged by Ignition version:

```text
inductiveautomation/ignition:8.3.6
```

The image packages the same Ignition installer used for bare-metal deployments. The gateway inside the image is configured to accept command-line arguments and environment variables for headless operation - no installer wizard, no manual configuration screen. You pass the gateway name, port assignments, JVM memory, and other settings through the compose file.

On first start, if the gateway finds no existing data in its data directory, it initializes a fresh gateway automatically. If data already exists (from a named volume that was seeded), the gateway loads that existing state instead. The `ia-eknorr/project-template` takes advantage of this by running a bootstrap service that seeds the named volume before the gateway starts, ensuring the gateway always finds a properly initialized data directory rather than starting completely cold. This is covered in detail in [The Compose Architecture](./compose-architecture.md).

## Licensing in Containers

Docker does not change how Ignition licensing works - it changes how licensing is stored and activated. The license is tied to the gateway's UUID, which is stored in the named volume. If the volume is deleted, the activation is lost and must be restored. The bootstrap service in the `ia-eknorr/project-template` generates a deterministic UUID from the gateway name so that activation can be recovered predictably.

See [Licensing in Containers](./licensing.md) for the full picture before running a licensed gateway in Docker.
