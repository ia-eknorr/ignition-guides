---
sidebar_position: 3
applies_to: [docker, kubernetes]
---

# Metrics and Log Stack

This guide covers the collector and storage stack that receives the telemetry the gateway pushes after [Gateway Telemetry](./gateway-telemetry.md) wiring is complete. Two approaches are documented: the Grafana LGTM stack for Docker Compose environments, and the kube-prometheus-stack for Kubernetes clusters that already run a Prometheus operator.

## Grafana LGTM stack (Docker Compose)

The LGTM stack is a set of Grafana Labs components that together cover the four observability signals:

| Component | Signal | Port |
| --- | --- | --- |
| Grafana Alloy | Collector and router for all signals | 4317 (gRPC), 4318 (HTTP) |
| Grafana Mimir | Metrics storage (Prometheus-compatible) | 9009 |
| Grafana Loki | Log storage | 3100 |
| Grafana Tempo | Trace storage | 3200 |
| Grafana | Visualization and dashboards | 3000 |

Pyroscope (profiles) is included in the compose file but is a separate topic.

### Compose stack

The following is a condensed observability-stack compose file, showing the core services. Run this stack on the same Docker network as your Ignition gateways so Alloy is reachable at `alloy:4318`.

```yaml
services:
  grafana:
    image: grafana/grafana:main
    container_name: grafana
    volumes:
      - grafana_data:/var/lib/grafana
      - ./config_files/grafana-config.yaml:/etc/grafana/provisioning/datasources/datasources.yaml
      - ./grafana_dashboards:/var/lib/grafana/dashboards
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_USER: ${GRAFANA_USER:-admin}
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-admin}
    networks:
      - monitoring

  alloy:
    image: grafana/alloy:latest
    container_name: alloy
    volumes:
      - ./config_files/alloy-config.alloy:/etc/alloy/config.alloy
      - /var/run/docker.sock:/var/run/docker.sock
    command:
      - "run"
      - "--server.http.listen-addr=0.0.0.0:12345"
      - "/etc/alloy/config.alloy"
    ports:
      - "4317:4317"
      - "4318:4318"
    networks:
      - monitoring

  mimir:
    image: grafana/mimir:3.0.0
    container_name: mimir
    command:
      - "-config.file=/etc/mimir/mimir-config.yaml"
    volumes:
      - ./config_files/mimir-config.yaml:/etc/mimir/mimir-config.yaml
      - mimir_data:/data
    ports:
      - "9009:9009"
    networks:
      - monitoring

  loki:
    image: grafana/loki:3.7.1
    container_name: loki
    ports:
      - "3100:3100"
    volumes:
      - ./config_files/loki-config.yaml:/etc/loki/local-config.yaml
    command:
      - "-config.file=/etc/loki/local-config.yaml"
    networks:
      - monitoring

  tempo:
    image: grafana/tempo:2.10.0
    container_name: tempo
    command:
      - "-config.file=/etc/tempo-config.yaml"
    volumes:
      - ./config_files/tempo-config.yaml:/etc/tempo-config.yaml
    ports:
      - "3200:3200"
    networks:
      - monitoring

networks:
  monitoring:
    name: monitoring
    driver: bridge

volumes:
  grafana_data:
  mimir_data:
```

The `monitoring` network is declared as an external network in the gateway compose file (the gateway's compose file joins it with `networks: monitoring: external: true`). This lets Alloy and the gateways communicate without putting everything in one compose file.

### Alloy pipeline

Alloy acts as a unified collector. It receives OTLP signals from the gateway, fans them out to the right storage backend, and also scrapes Prometheus-format metrics from other components.

The core OTLP receiver in `alloy-config.alloy`:

```alloy
otelcol.receiver.otlp "default" {
  grpc {
    endpoint = "0.0.0.0:4317"
  }
  http {
    endpoint = "0.0.0.0:4318"
  }

  output {
    metrics = [otelcol.processor.batch.default.input]
    traces  = [otelcol.processor.batch.default.input,
               otelcol.connector.servicegraph.default.input,
               otelcol.connector.spanmetrics.default.input]
    logs    = [otelcol.processor.batch.default.input]
  }
}

otelcol.processor.batch "default" {
  timeout             = "5s"
  send_batch_size     = 1000
  send_batch_max_size = 5000
  output {
    metrics = [otelcol.exporter.prometheus.default.input]
    traces  = [otelcol.exporter.otlp.tempo.input]
    logs    = [otelcol.exporter.loki.to_loki.input]
  }
}

otelcol.exporter.prometheus "default" {
  forward_to                       = [prometheus.remote_write.default.receiver]
  resource_to_telemetry_conversion = true
}

prometheus.remote_write "default" {
  endpoint {
    url = "http://mimir:9009/api/v1/push"
  }
}

otelcol.exporter.otlp "tempo" {
  timeout = "20s"
  client {
    endpoint = "tempo:4317"
    tls {
      insecure            = true
      insecure_skip_verify = true
    }
  }
}

otelcol.exporter.loki "to_loki" {
  forward_to = [loki.write.grafana_loki.receiver]
}
```

Alloy also generates span metrics and service graphs from traces, forwarding them as additional metric series to Mimir. This gives you RED (rate, errors, duration) metrics derived from trace data without any application-side changes.

For the log filtering and processing pipeline, see [Log Pipeline](./logs.md).

### Grafana datasource provisioning

Provision all four datasources in `grafana-config.yaml` with cross-linking enabled so Grafana can jump from a trace to its correlated logs and profiles:

```yaml
apiVersion: 1

datasources:
  - name: Mimir
    type: prometheus
    uid: PAE45454D0EDB9216
    access: proxy
    url: http://mimir:9009/prometheus
    isDefault: true
    editable: true

  - name: Loki
    type: loki
    uid: P8E80F9AEF21F6940
    access: proxy
    url: http://loki:3100
    editable: true

  - name: Tempo
    type: tempo
    uid: P214B5B846CF3925F
    access: proxy
    url: http://tempo:3200
    editable: true
    jsonData:
      nodeGraph:
        enabled: true
      serviceMap:
        datasourceUid: "PAE45454D0EDB9216"
      tracesToLogsV2:
        datasourceUid: "P8E80F9AEF21F6940"
        filterByTraceID: true
        spanStartTimeShift: "-1m"
        spanEndTimeShift: "1m"
      tracesToMetrics:
        datasourceUid: "PAE45454D0EDB9216"
        spanStartTimeShift: "-1m"
        spanEndTimeShift: "1m"
```

The `tracesToLogsV2` configuration allows navigating from a Tempo trace directly to the correlated Loki log lines. The `tracesToMetrics` link navigates from a trace span to the corresponding metric panel in Mimir. These links work because the OTel agent attaches `trace_id` and `span_id` to log records (via MDC capture) and because Alloy promotes the same resource attributes to Prometheus labels.

## kube-prometheus-stack (Kubernetes)

On Kubernetes, the kube-prometheus-stack Helm chart installs Prometheus Operator, Prometheus, Grafana, and Alertmanager as a bundle. This is the recommended approach when you already operate a Prometheus-based observability platform or when you want native Kubernetes resource monitoring alongside gateway metrics.

### When to use which

Use the **Grafana LGTM stack** when:

- Running Docker Compose on a developer workstation or a single VM.
- You want long-term storage for all four signal types (metrics, logs, traces, profiles) from a single compose file.
- You are not already running a Prometheus operator.

Use the **kube-prometheus-stack** when:

- You are deploying to a Kubernetes cluster that already runs or benefits from a Prometheus operator.
- You want Kubernetes infrastructure metrics (node, pod, PVC utilization) alongside gateway metrics.
- Metrics retention is short per-cluster and you remote-write to a central Prometheus-compatible store.

### Scraping the OTel agent's Prometheus endpoint

The kube-prometheus-stack does not receive OTLP push from the gateway. Instead, when the OTel operator injects the agent in-cluster (via an `Instrumentation` CRD), the agent stands up a Prometheus `/metrics` endpoint on port 9000. The kube-prometheus-stack scrapes that endpoint via a `PodMonitor`.

The `Instrumentation` CRD that enables the Prometheus exporter alongside OTLP:

```yaml
apiVersion: opentelemetry.io/v1alpha1
kind: Instrumentation
metadata:
  name: ignition
spec:
  exporter:
    endpoint: http://alloy:4318
  propagators:
    - tracecontext
    - baggage
  java:
    env:
      # Logs take the stdout-JSON path on Kubernetes, not OTLP
      - name: OTEL_LOGS_EXPORTER
        value: "none"
      # Export metrics over OTLP and also stand up a Prometheus endpoint
      - name: OTEL_METRICS_EXPORTER
        value: "otlp,prometheus"
      - name: OTEL_EXPORTER_PROMETHEUS_PORT
        value: "9000"
      - name: OTEL_EXPORTER_PROMETHEUS_HOST
        value: "0.0.0.0"
      - name: OTEL_INSTRUMENTATION_DROPWIZARD_METRICS_ENABLED
        value: "true"
      - name: OTEL_INSTRUMENTATION_JDBC_DATASOURCE_ENABLED
        value: "true"
```

The `PodMonitor` that targets port 9000 on gateway pods:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PodMonitor
metadata:
  name: ignition-metrics
  labels:
    release: kube-prometheus-stack
spec:
  selector:
    matchLabels:
      app.kubernetes.io/instance: my-release
    matchExpressions:
      - key: app.kubernetes.io/name
        operator: In
        values: [frontend, backend]
  podMetricsEndpoints:
    - path: /metrics
      interval: 15s
      relabelings:
        # Keep only the gateway container's https port so each pod yields one target
        - sourceLabels: [__meta_kubernetes_pod_container_name, __meta_kubernetes_pod_container_port_name]
          regex: gateway;https
          action: keep
        # Target the gateway container's OTel Prometheus exporter on port 9000
        - sourceLabels: [__meta_kubernetes_pod_ip]
          targetLabel: __address__
          replacement: "$1:9000"
          action: replace
      metricRelabelings:
        # Keep only Ignition-relevant metric families
        - sourceLabels: [__name__]
          regex: "ignition_.*|perspective_.*|databases_.*|jvm_memory.*|jvm_threads.*|process_cpu.*|process_uptime.*"
          action: keep
```

The `metricRelabelings` block is important: the OTel agent exports a large number of JVM and HTTP metrics from instrumented libraries. Keeping only the `ignition_*`, `perspective_*`, and `databases_*` families (plus essential JVM metrics) prevents high cardinality from inflating storage and query costs.

### kube-prometheus-stack Helm values

A typical production deployment runs Prometheus in agent mode: short local retention (2 h) with remote write to a central store. Key values from `common-values.yaml`:

```yaml
kube-prometheus-stack:
  prometheus:
    prometheusSpec:
      retention: 2h
      remoteWrite:
        - url: https://prometheus.your-domain.com/api/v1/write
          writeRelabelConfigs:
            # Drop verbose container metrics, keep essentials
            - sourceLabels: [__name__]
              regex: 'container_(tasks_state|memory_failures_total|fs_.*|network_.*)'
              action: drop
            # Drop high-cardinality kube labels
            - sourceLabels: [__name__]
              regex: 'kube_(pod_labels|pod_annotations)'
              action: drop
            # Drop internal scrape metrics
            - sourceLabels: [__name__]
              regex: '(go_|promhttp_).*'
              action: drop
  grafana:
    enabled: false  # Use a shared Grafana instance instead
  alertmanager:
    enabled: false
  # Disable control plane exporters (require kube-system access)
  kubeControllerManager:
    enabled: false
  kubeScheduler:
    enabled: false
  kubeProxy:
    enabled: false
  kubeEtcd:
    enabled: false
```

For the agent wiring concepts that underlie the in-cluster OTel operator injection, see [Gateway Telemetry](./gateway-telemetry.md).
