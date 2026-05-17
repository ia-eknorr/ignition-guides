---
id: index
slug: /
---

# Ignition Guides

Unofficial guides for modern Ignition SCADA infrastructure and workflows.

## What Is in Here

### Getting Started

Tools and setup required across all guides - set up once, referenced everywhere.

- [Workstation Setup](./getting-started/workstation-setup.md) - VS Code, Git, GitHub CLI, Docker Desktop, kubectl, helm, terraform, kind
- [Traefik Reverse Proxy](./getting-started/traefik.md) - Named local URLs for Docker-based guides
- [Local Kubernetes Setup](./getting-started/kubernetes-setup.md) - Docker Desktop Kubernetes or kind, with the Ignition Helm chart repo configured

### Guides

Step-by-step reference guides for working with Ignition in a professional development environment.

- [Docker](./guides/docker/intro.md) - Compose architecture, volume strategy, licensing, and day-two operations for the project-template.
- [Kubernetes](./guides/kubernetes/concepts.md) - Kubernetes concepts for Ignition developers and a curated lens on the official Helm chart.
- [Version Control](./guides/version-control/intro.md) - Git workflows for Ignition projects: workstation setup, branching, pull requests, and more.

### Labs

Hands-on labs that walk through real Ignition workflows end to end.

- [Docker Lab](./labs/docker-ignition-lab.md) - Start an Ignition gateway from the project-template, watch each service boot, and practice day-two operations.
- [Helm Lab](./labs/helm-ignition-lab.md) - Deploy Ignition to a local Kubernetes cluster using the official Inductive Automation Helm chart, verify persistence across pod restarts, and customize with your own values.
- [Version Control Lab](./labs/version-control-lab.md) - Set up version control for an Ignition project from scratch using Docker and GitHub.

### Reference

Quick-reference pages for conventions and standards used across guides.

- [Git Style Guide](./reference/git-style-guide.md) - Naming conventions for repositories, branches, commits, and pull requests.
- [Kubernetes Sizing](./reference/kubernetes-sizing.md) - CPU, memory, JVM heap, PVC, and probe sizing tables for Ignition gateways on Kubernetes.
- [Licensing Decision Tree](./reference/licensing-decision-tree.md) - Choose between Standard and Leased licenses by deployment scenario.

### Tools

Reference pages for community tools built around Ignition.

- [Stoker Operator](./tools/stoker-operator.md) - Git-driven configuration sync for Ignition gateways on Kubernetes.
- [ignition-lint](./tools/ignition-lint.md) - Linter for Ignition project resources.
