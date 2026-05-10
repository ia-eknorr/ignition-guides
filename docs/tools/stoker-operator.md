---
sidebar_position: 2
---

# Stoker Operator

**GitHub**: [ia-eknorr/stoker-operator](https://github.com/ia-eknorr/stoker-operator)  
**Docs**: [ia-eknorr.github.io/stoker-operator](https://ia-eknorr.github.io/stoker-operator/)

## What It Does

Stoker is a Kubernetes operator that continuously syncs Ignition SCADA gateway configuration from Git. It uses a controller + agent sidecar architecture:

- The **controller** watches `GatewaySync` custom resources, resolves git refs, and discovers gateway pods
- The **agent** runs as a native sidecar inside gateway pods, clones the repo, and syncs files to the gateway's data directory

No shared PVC required. Communication between controller and agent is entirely via Kubernetes ConfigMaps.

## When to Use It

Stoker is for teams running Ignition on Kubernetes who want GitOps-style config management - treat your Ignition project files as code, stored in Git, automatically deployed to gateways when changes land on a branch.

## Key Features

- Watches a git branch and syncs on commit (or via webhook trigger)
- Supports GitHub App, SSH key, and API token authentication
- Mutating webhook injects the agent sidecar automatically with namespace/pod labels
- Webhook receiver supports GitHub releases, ArgoCD notifications, Kargo promotions, and generic payloads
- Helm chart available at [charts.ia.io](https://charts.ia.io)

## Quick Links

- [Quickstart](https://ia-eknorr.github.io/stoker-operator/quickstart)
- [Installation](https://ia-eknorr.github.io/stoker-operator/installation)
- [Helm Values Reference](https://ia-eknorr.github.io/stoker-operator/reference/helm-values)
