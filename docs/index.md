---
id: index
slug: /
---

# Ignition Guides

Unofficial guides for modern Ignition SCADA infrastructure and workflows.

## What Is in Here

### Getting Started

Tools and setup required across all guides - set up once, referenced everywhere.

- [Workstation Setup](./getting-started/workstation-setup.md) - VS Code, Git, GitHub CLI, Docker Desktop
- [Traefik Reverse Proxy](./getting-started/traefik.md) - Named local URLs for Docker-based guides

### Guides

Step-by-step reference guides for working with Ignition in a professional development environment.

- [Docker](./guides/docker/intro.md) - Compose architecture, volume strategy, licensing, and day-two operations for the project-template.
- [Version Control](./guides/version-control/intro.md) - Git workflows for Ignition projects: workstation setup, branching, pull requests, and more.

### Labs

Hands-on labs that walk through real Ignition workflows end to end.

- [Docker Lab](./labs/docker-ignition-lab.md) - Start an Ignition gateway from the project-template, watch each service boot, and practice day-two operations.
- [Version Control Lab](./labs/version-control-lab.md) - Set up version control for an Ignition project from scratch using Docker and GitHub.

### Reference

Quick-reference pages for conventions and standards used across guides.

- [Git Style Guide](./reference/git-style-guide.md) - Naming conventions for repositories, branches, commits, and pull requests.

### Tools

Reference pages for community tools built around Ignition.

- [Stoker Operator](./tools/stoker-operator.md) - Git-driven configuration sync for Ignition gateways on Kubernetes.
- [ignition-lint](./tools/ignition-lint.md) - Linter for Ignition project resources.
