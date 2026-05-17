---
sidebar_position: 1
---

# Getting Started

Welcome to Ignition Guides - a collection of community guides for working with
[Ignition SCADA](https://inductiveautomation.com/) using modern development practices.

## What Is in Here

| Section | What You Will Find |
| --- | --- |
| [Guides](../guides/docker/intro.md) | Step-by-step procedures for real workflows |
| [Labs](../labs/docker-ignition-lab.md) | Hands-on exercises that walk a workflow end to end |
| [Reference](../reference/git-style-guide.md) | Quick-reference pages for conventions, standards, and Ignition concepts |
| [Tools](../tools/overview.md) | Community tools built around Ignition |

## Minimum Setup

Set up these tools once - every guide references back here rather than repeating the steps.

**Required for all guides:**

- [Workstation Setup](./workstation-setup.md) - VS Code, Git, GitHub CLI, Docker Desktop

**Required for labs:**

- [Traefik Reverse Proxy](./traefik.md) - Named local URLs instead of port numbers
  (e.g., `my-gw.localtest.me` instead of `localhost:9088`)

## Topics

Each topic pairs a concept guide with a hands-on lab. The order below is the recommended sequence for someone starting from scratch, since each topic builds on the previous one. Every topic lists what it builds on, so if you already know the prerequisites you can drop in anywhere.

<div className="pathways__setup">
  <strong>Set up once before any topic:</strong>
  <ul>
    <li><a href="./workstation-setup">Workstation Setup</a> - required for every guide</li>
    <li><a href="./traefik">Traefik Reverse Proxy</a> - required for any lab</li>
    <li><a href="./kubernetes-setup">Kubernetes Setup</a> - required for the Helm lab</li>
  </ul>
</div>

<div className="pathways">

<div className="pathway">
  <div className="pathway__badge pathway__badge--start">Start here</div>
  <h3 className="pathway__title">Containerization</h3>
  <p className="pathway__desc">Docker Compose, the project-template architecture, licensing, and day-to-day gateway operations. Get an Ignition gateway running locally.</p>
  <div className="pathway__links">
    <a className="pathway__link" href="../guides/docker/intro"><span className="pathway__chip">Guide</span> Docker &amp; Compose</a>
    <a className="pathway__link" href="../labs/docker-ignition-lab"><span className="pathway__chip pathway__chip--lab">Lab</span> Docker Ignition</a>
  </div>
</div>

<div className="pathway">
  <div className="pathway__badge">Builds on: Containerization</div>
  <h3 className="pathway__title">Version Control</h3>
  <p className="pathway__desc">Git, GitHub, and source control workflows for the Ignition project files your gateway produces. Track gateway configuration as code.</p>
  <div className="pathway__links">
    <a className="pathway__link" href="../guides/version-control/intro"><span className="pathway__chip">Guide</span> Git Workflow</a>
    <a className="pathway__link" href="../labs/version-control-lab"><span className="pathway__chip pathway__chip--lab">Lab</span> Version Control</a>
  </div>
</div>

<div className="pathway">
  <div className="pathway__badge">Builds on: Containerization, Version Control</div>
  <h3 className="pathway__title">Orchestration</h3>
  <p className="pathway__desc">Kubernetes concepts for Ignition and the official Inductive Automation Helm chart for deploying gateways on a local cluster.</p>
  <div className="pathway__links">
    <a className="pathway__link" href="../guides/kubernetes/concepts"><span className="pathway__chip">Guide</span> Kubernetes &amp; Helm</a>
    <a className="pathway__link" href="../labs/helm-ignition-lab"><span className="pathway__chip pathway__chip--lab">Lab</span> Helm Ignition</a>
  </div>
</div>

</div>
