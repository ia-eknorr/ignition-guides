---
sidebar_position: 1
applies_to: [docker, kubernetes, bare-metal]
---

# Observability for Ignition

This pillar covers how to see what an Ignition gateway is doing in production: its metrics, logs, and traces, and the stack that collects and visualizes them. The patterns here are deployment-agnostic. They apply whether the gateway runs under Docker Compose, on Kubernetes, or on a bare-metal install, with the cloud-specific wiring called out where it differs.

## What to monitor

A useful picture of a running gateway combines a few signal families:

- **RED metrics** (rate, errors, duration) for gateway and Perspective request traffic.
- **JVM health** such as heap, garbage collection, and thread counts, since the gateway is a long-lived JVM.
- **Per-database** connection-pool and query metrics for each configured database connection.
- **Perspective** session and component activity.
- **MQTT / data throughput** where the gateway moves tag data over MQTT or other transports.

## How the pillar is organized

The flagship guide wires the gateway's OpenTelemetry export, the agnostic foundation every other piece builds on. From there, guides cover the metrics stack (Prometheus/Grafana or Grafana LGTM), logs (Loki + Alloy), traces and profiling (Tempo + Pyroscope), external exporters, and custom Ignition metrics. These land across upcoming rounds.

As the pillar grows, short one-screen operational tips will be collected under a **Tasks** sub-section, following the same Concepts / Tasks / Tutorials / Reference convention the rest of the site uses.

## Scope

For core-product concepts, this pillar links out rather than re-explaining: see [docs.ia.io](https://docs.ia.io) for the gateway internals and [charts.ia.io](https://charts.ia.io) for Helm chart value semantics. The guides here own the integration and operational glue: how to wire, compose, and operate the observability stack around a gateway.
