---
sidebar_position: 1
---

# Getting Started

Welcome to Ignition Guides - a collection of community guides for working with
[Ignition SCADA](https://inductiveautomation.com/) using modern development practices.

## What Is in Here

| Section | What You Will Find |
| --- | --- |
| [Guides](../guides/version-control/intro.md) | Step-by-step procedures for real workflows (version control, etc.) |
| [Labs](../labs/git-ignition-lab.md) | Hands-on exercises that walk a workflow end to end |
| [Reference](../reference/git-style-guide.md) | Quick-reference pages for conventions and standards |
| [Tools](../tools/overview.md) | Community tools built around Ignition |

## Minimum Setup

Most guides on this site require the same core tools. Set them up once here and every
guide will reference back to this page rather than repeating the steps.

**Required for all guides:**

- [Workstation Setup](./workstation-setup.md) - VS Code, Git, GitHub CLI, Docker Desktop

**Required for Docker-based guides** (most labs and some advanced guides):

- [Traefik Reverse Proxy](./traefik.md) - Named local URLs instead of port numbers
  (e.g., `my-gw.localtest.me` instead of `localhost:9088`)

## Where to Start

**New to Git and version control?**
Start with the [Hands-On Lab](../labs/git-ignition-lab.md). It walks you through a complete
workflow from cloning to merging a pull request, with explanations along the way.

**Know Git but new to Ignition + Docker workflows?**
Read the [Version Control Guide](../guides/version-control/intro.md) for context, then
jump to the lab.
