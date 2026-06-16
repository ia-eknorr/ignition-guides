---
sidebar_position: 2
applies_to: [docker, kubernetes, bare-metal]
---

# Gateway Telemetry

An Ignition gateway does not expose a built-in metrics or telemetry endpoint. Observability requires attaching the **OpenTelemetry Java agent** to the gateway process. The agent instruments the JVM at startup, intercepts Ignition's internal Dropwizard/Codahale metrics, and pushes metrics, traces, and logs to a collector over OTLP. Nothing is scraped from the gateway; everything is pushed.

This guide shows how to wire the agent for Docker Compose and bare-metal deployments. The key concepts and property names are the same in both cases. For Kubernetes, the OTel operator can inject the agent automatically via an `Instrumentation` CRD, covered briefly at the end of this page.

## How it works

```
Ignition gateway (JVM)
  └── OTel Java agent (attached at startup)
        ├── metrics  → OTLP → Alloy/Collector → Mimir / Prometheus
        ├── traces   → OTLP → Alloy/Collector → Tempo
        └── logs     → OTLP → Alloy/Collector → Loki
```

The agent is loaded by the JVM before any application code runs. It instruments:

- **Dropwizard/Codahale metrics** (`otel.instrumentation.dropwizard-metrics.enabled=true`): these are Ignition's internal performance counters (tag provider throughput, Perspective session counts, gateway thread pool stats, and more). Without this setting the most useful Ignition-specific metrics are invisible.
- **JDBC datasource metrics** (`otel.instrumentation.jdbc-datasource.enabled=true`): per-connection-pool query counts, latency, and pool utilization for every database connection configured in the gateway.
- **Logback appender**: every log entry written through Ignition's SLF4J/Logback logging layer is forwarded as an OTLP log record.
- **HTTP spans**: traces for every inbound HTTP request, giving you latency and error-rate breakdowns for the gateway web interface and Perspective sessions.

## Prerequisites

Download the OpenTelemetry Java agent JAR from the [OpenTelemetry releases page](https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases). The JAR filename is `opentelemetry-javaagent.jar`. Place it somewhere the gateway process can read.

A collector must be reachable over the network at OTLP HTTP (`:4318`) or gRPC (`:4317`). The [Metrics and Log Stack guide](./metrics-stack.md) covers standing up Grafana Alloy as the collector.

## Docker Compose wiring

The agent JAR is mounted into the container from the host and passed to the JVM through the `command:` block after the `--` delimiter. Environment variables prefixed `OTEL_` set agent properties at the container level; the `-Dotel.*` JVM system properties in the `command:` block override them or provide values that reference compose variables.

```yaml
services:
  ignition:
    image: inductiveautomation/ignition:8.3.6
    volumes:
      # Mount the agent JAR and (optionally) the properties file
      - ./dependencies:/usr/local/bin/ignition/dependencies
    environment:
      ACCEPT_IGNITION_EULA: "Y"
      OTEL_SERVICE_NAME: ${GATEWAY_NAME}
    command: >
      -n ${GATEWAY_NAME}
      -m 1024
      -h 8088
      -s 8043
      -a ${GATEWAY_NAME}
      --
      -javaagent:/usr/local/bin/ignition/dependencies/opentelemetry-javaagent.jar
      -Dotel.service.name=${GATEWAY_NAME}
      -Dotel.resource.attributes=gateway=${GATEWAY_NAME},service.name=${GATEWAY_NAME},environment=${MODE},ignition.version=${VERSION}
      -Dotel.exporter.otlp.protocol=http/protobuf
      -Dotel.javaagent.logging=none
      -Dotel.instrumentation.dropwizard-metrics.enabled=true
      -Dotel.instrumentation.jdbc-datasource.enabled=true
      -Dotel.instrumentation.runtime-telemetry-java17.enabled=false
      -Dotel.instrumentation.runtime-telemetry.enabled=false
      -Dotel.logs.exporter=otlp
      -Dotel.exporter.otlp.logs.endpoint=http://${ALLOY}:4318/v1/logs
      -Dotel.instrumentation.logback-appender.enabled=true
      -Dotel.instrumentation.logback-mdc.enabled=true
      -Dotel.instrumentation.logback-appender.experimental.capture-mdc-attributes=*
      -Dotel.traces.exporter=otlp
      -Dotel.exporter.otlp.traces.protocol=http/protobuf
      -Dotel.exporter.otlp.traces.endpoint=http://${ALLOY}:4318/v1/traces
      -Dotel.metrics.exporter=otlp
      -Dotel.exporter.otlp.metrics.protocol=http/protobuf
      -Dotel.exporter.otlp.metrics.endpoint=http://${ALLOY}:4318/v1/metrics
```

A few points about the arguments above:

- `--` is the delimiter Ignition uses to separate its own startup arguments from JVM system properties. See [Supplemental JVM and Wrapper Arguments](https://docs.inductiveautomation.com/docs/8.3/platform/docker-image#supplemental-jvm-and-wrapper-arguments) for the full description of this convention.
- `runtime-telemetry` and `runtime-telemetry-java17` are disabled because the Dropwizard instrumentation already captures the JVM metrics Ignition exposes; enabling both produces duplicated metric series.
- `otel.javaagent.logging=none` silences the agent's own startup chatter in the container log stream. Change to `simple` when debugging agent configuration.
- The `ALLOY` variable should resolve to the DNS name of the Alloy container on the shared Docker network. In the observability stack compose file this is `alloy`.

For a complete list of properties and what each controls, see the [OTel Properties Reference](../../reference/ignition-otel-properties.md).

## Bare-metal wiring

On a bare-metal (or VM) install the gateway runs as a system service managed by the Tanuki Java Service Wrapper. All JVM arguments are set in `ignition.conf`, located in the Ignition install directory (typically `C:\Program Files\Inductive Automation\Ignition\` on Windows or `/usr/local/bin/ignition/` on Linux).

The cleanest approach for bare-metal is to put OTel properties in a separate `otel-agent.properties` file and point `ignition.conf` at it with one JVM arg.

### `ignition.conf` additions

Add these lines after the existing `wrapper.java.additional.*` entries. Use index numbers that do not collide with existing entries (indexes 20 and 25 are free in a standard install):

```properties
#Agent Settings
wrapper.java.additional.20=-javaagent:"/path/to/opentelemetry-javaagent.jar"
wrapper.java.additional.25=-Dotel.javaagent.configuration-file="/path/to/otel-agent.properties"
```

Replace `/path/to/` with the actual path where you placed the JAR and properties file. The JAR must be readable by the account that runs the Ignition service.

For the full `ignition.conf` structure and existing `wrapper.java.additional.*` slots, see the [Gateway Configuration File Reference](https://docs.inductiveautomation.com/docs/8.3/appendix/reference-pages/gateway-configuration-file-reference).

### `otel-agent.properties`

```properties
# OpenTelemetry Java Agent Configuration
# NOTE: -javaagent: entries must remain as JVM args in ignition.conf

# --- Identity ---
otel.service.name=my-gateway
otel.resource.attributes=service.name=my-gateway,gateway=my-gateway,environment=Production,ignition.version=8.3.6

# --- Exporter ---
otel.exporter.otlp.protocol=http/protobuf

# --- Logging ---
otel.javaagent.logging=none
# otel.javaagent.logging=simple

# --- Metrics ---
otel.instrumentation.dropwizard-metrics.enabled=true
otel.instrumentation.jdbc-datasource.enabled=true
otel.metrics.exporter=otlp
otel.exporter.otlp.metrics.protocol=http/protobuf
otel.exporter.otlp.metrics.endpoint=http://<alloy-host>:4318/v1/metrics
otel.metric.export.interval=5000

# --- Logs ---
otel.logs.exporter=otlp
otel.exporter.otlp.logs.endpoint=http://<alloy-host>:4318/v1/logs
otel.instrumentation.logback-appender.enabled=true
otel.instrumentation.logback-mdc.enabled=true

# --- Traces ---
otel.traces.exporter=otlp
otel.exporter.otlp.traces.protocol=http/protobuf
otel.exporter.otlp.traces.endpoint=http://<alloy-host>:4318/v1/traces
```

Replace `<alloy-host>` with the hostname or IP of your Alloy collector. For a local dev machine with the observability stack running on the same host, this is typically `localhost`. After editing `ignition.conf`, restart the Ignition service for changes to take effect.

## On Kubernetes (in-cluster auto-inject)

The OTel Operator for Kubernetes can inject the agent automatically into gateway pods via an `Instrumentation` CRD, eliminating the need to manage the JAR or configure JVM args by hand. The in-cluster pattern also enables a dual OTLP and Prometheus export path, where the agent exposes a `/metrics` endpoint on port 9000 for scraping by Prometheus or the kube-prometheus-stack.

This pattern is covered as a forward topic. The Instrumentation CRD wiring and the PodMonitor that targets port 9000 are referenced in the [Metrics and Log Stack guide](./metrics-stack.md).

## What you get after wiring

Once the gateway restarts with the agent attached and the collector is reachable, three signal families appear in your stack:

- **Metrics**: JVM heap, GC pause duration and frequency, thread pool utilization, HTTP request rates and latencies, Ignition-specific gauges (tag provider write throughput, Perspective session counts), and JDBC connection pool stats per configured database. All available in Grafana via Mimir.
- **Traces**: Spans for every inbound HTTP request handled by the gateway web server, including Perspective page loads and Designer connections. Cross-linked to logs and profiles in the Grafana datasource configuration.
- **Logs**: Every entry written through the gateway's Logback appender forwarded as a structured OTLP log record and available in Loki. MDC fields (trace ID, span ID) are captured, enabling trace-to-log correlation in Grafana.

For the metrics and log collection stack, see [Metrics and Log Stack](./metrics-stack.md). For the full property reference, see [OTel Properties Reference](../../reference/ignition-otel-properties.md).
