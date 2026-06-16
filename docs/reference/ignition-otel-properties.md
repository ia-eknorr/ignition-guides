---
sidebar_position: 6
---

# OTel Properties Reference

This page lists the OpenTelemetry Java agent properties used to instrument an Ignition gateway. Properties appear in `otel-agent.properties` on bare-metal installs or as `-Dotel.*` JVM arguments in the Docker Compose `command:` block.

For wiring instructions see [Gateway Telemetry](../guides/observability/gateway-telemetry.md).

## Identity and resource attributes

| Property | Example value | Description |
| --- | --- | --- |
| `otel.service.name` | `my-gateway` | The service name attached to every metric, trace, and log record. Appears as the `service.name` resource attribute. Should match the gateway name for easy correlation. |
| `otel.resource.attributes` | `gateway=gw1,environment=Production,ignition.version=8.3.6` | Comma-separated key=value pairs added to every signal as resource attributes. Useful for filtering in Grafana across multiple gateways or environments. |

## Exporter protocol

| Property | Example value | Description |
| --- | --- | --- |
| `otel.exporter.otlp.protocol` | `http/protobuf` | Wire protocol for OTLP export. `http/protobuf` sends to port 4318. Use `grpc` for port 4317. This is the default protocol for all signal types unless overridden per-signal below. |

## Agent logging

| Property | Example value | Description |
| --- | --- | --- |
| `otel.javaagent.logging` | `none` | Controls the agent's own log output. `none` silences startup messages; `simple` enables them for debugging. Does not affect Ignition's application log forwarding. |

## Metrics

| Property | Example value | Description |
| --- | --- | --- |
| `otel.metrics.exporter` | `otlp` | Metrics export backend. Use `otlp` to push over OTLP. The gateway does not expose a native Prometheus endpoint; set `prometheus` here only if the agent should additionally stand up its own `/metrics` scrape endpoint (used in the Kubernetes in-cluster pattern on port 9000). |
| `otel.exporter.otlp.metrics.protocol` | `http/protobuf` | Per-signal protocol override for metrics. |
| `otel.exporter.otlp.metrics.endpoint` | `http://alloy:4318/v1/metrics` | OTLP endpoint for metrics. |
| `otel.metric.export.interval` | `5000` | Milliseconds between metric export cycles. 5000 ms (5 s) is a good balance between resolution and collector load. |
| `otel.instrumentation.dropwizard-metrics.enabled` | `true` | **Required for Ignition metrics.** Ignition's internal performance counters use the Dropwizard/Codahale metrics library. Without this flag the most useful Ignition-specific gauges (tag write throughput, Perspective sessions, thread pool stats) are not captured. |
| `otel.instrumentation.jdbc-datasource.enabled` | `true` | Enables per-connection-pool metrics for every database connection configured in the Ignition gateway (query latency, pool utilization, connection counts). |
| `otel.instrumentation.runtime-telemetry.enabled` | `false` | JVM runtime telemetry (generic). Disabled when Dropwizard instrumentation is active to avoid duplicate JVM metric series. |
| `otel.instrumentation.runtime-telemetry-java17.enabled` | `false` | Java 17 JVM telemetry variant. Disabled for the same deduplication reason as above. |

## Logs

| Property | Example value | Description |
| --- | --- | --- |
| `otel.logs.exporter` | `otlp` | Log export backend. |
| `otel.exporter.otlp.logs.endpoint` | `http://alloy:4318/v1/logs` | OTLP endpoint for logs. |
| `otel.instrumentation.logback-appender.enabled` | `true` | Captures every log entry written through Ignition's Logback appender and forwards it as an OTLP log record. This is the primary source of gateway log data in Loki. |
| `otel.instrumentation.logback-mdc.enabled` | `true` | Includes Logback MDC fields (such as trace ID and span ID) in forwarded log records, enabling trace-to-log correlation in Grafana. |
| `otel.instrumentation.logback-appender.experimental.capture-mdc-attributes` | `*` | Captures all MDC attributes as log record attributes. The `*` wildcard captures everything; narrow to specific keys if cardinality is a concern. |

## Traces

| Property | Example value | Description |
| --- | --- | --- |
| `otel.traces.exporter` | `otlp` | Trace export backend. |
| `otel.exporter.otlp.traces.protocol` | `http/protobuf` | Per-signal protocol override for traces. |
| `otel.exporter.otlp.traces.endpoint` | `http://alloy:4318/v1/traces` | OTLP endpoint for traces. |

## Manual method instrumentation

| Property | Example value | Description |
| --- | --- | --- |
| `otel.instrumentation.methods.include` | `com.inductiveautomation.ignition.gateway.tags.managed.ManagedTagProvider[browseTagsAsync,readAsync]` | Semicolon-separated list of `FullyQualifiedClassName[method1,method2]` entries. Adds spans for specific internal Ignition methods that are not instrumented by default. Useful for tracing tag read/write paths. See the comment block in `otel-agent.properties` for a full example targeting the tag provider stack. |

## Pyroscope profiling (optional)

The Pyroscope integration requires the `pyroscope-otel.jar` extension JAR alongside the main agent. These properties are set as environment variables (not in `otel-agent.properties`) when using the extension:

| Environment variable | Description |
| --- | --- |
| `OTEL_JAVAAGENT_EXTENSIONS` | Path to `pyroscope-otel.jar`. Activates the Pyroscope OTel bridge. |
| `PYROSCOPE_SERVER_ADDRESS` | Address of the Pyroscope server (e.g. `http://pyroscope:4040`). |
| `PYROSCOPE_APPLICATION_NAME` | Application name label in Pyroscope, typically matches the gateway name. |
| `PYROSCOPE_FORMAT` | Profile format. `jfr` is recommended for the Grafana Pyroscope datasource. |

Profiling is a separate concern from the core metrics/traces/logs pipeline and is covered as a future topic in this pillar.
