---
sidebar_position: 4
applies_to: [docker, kubernetes]
---

# Log Pipeline

After [Gateway Telemetry](./gateway-telemetry.md) wiring is complete, the OTel agent forwards every Ignition log entry as an OTLP log record to Alloy. From there Alloy processes, filters, and writes the records to Loki. This guide explains the Alloy pipeline config and the rationale behind each filter and processing stage.

The pipeline described here has two variants: one for Docker Compose (reads from the Docker log socket), and one for Kubernetes (reads via the Kubernetes pod log API). Both funnel into the same Loki backend.

## Docker Compose pipeline

In the Docker Compose environment Alloy uses `loki.source.docker` to tail container logs, enriches them with container labels, and processes them through a pipeline before writing to Loki.

```alloy
discovery.docker "ignition" {
  host             = "unix:///var/run/docker.sock"
  refresh_interval = "5s"
}

discovery.relabel "ignition" {
  targets = []
  rule {
    source_labels = ["__meta_docker_container_name"]
    regex         = "/(.*)"
    target_label  = "container"
  }
}

loki.source.docker "ignition" {
  host             = "unix:///var/run/docker.sock"
  targets          = discovery.docker.ignition.targets
  forward_to       = [loki.process.add_labels.receiver]
  relabel_rules    = discovery.relabel.ignition.rules
  refresh_interval = "5s"
}
```

The `discovery.relabel` block strips the leading `/` from Docker container names so the `container` label is just `my-gateway` rather than `/my-gateway`.

### Processing pipeline

```alloy
loki.process "add_labels" {
  forward_to = [loki.write.grafana_loki.receiver]

  stage.regex {
    expression = `^jvm \d+ \| .*? \| (?P<temp_level>[A-Z])\s+\[(?P<logger>.*?)\] \[(?P<log_time>.*?)\]: (?P<msg_content>.*)$`
  }

  stage.template {
    source   = "level"
    template = `{{ $l := .temp_level | trim }}{{ if eq $l "I" }}info{{ else if eq $l "W" }}warning{{ else if eq $l "E" }}error{{ else }}debug{{ end }}`
  }

  stage.logfmt {
    source  = "msg_content"
    mapping = { "trace_id" = "", "span_id" = "" }
  }

  stage.labels {
    values = {
      level    = "level",
      logger   = "logger",
      trace_id = "trace_id",
    }
  }

  stage.output {
    source = "msg_content"
  }
}

loki.write "grafana_loki" {
  endpoint {
    url = "http://loki:3100/loki/api/v1/push"
  }
}
```

Stage-by-stage rationale:

1. **`stage.regex`**: Ignition's default log format prefixes each line with `jvm <pid> | <timestamp> | <level-char> [<logger>] [<time>]: <message>`. This regex captures the level character, logger name, and message content as named groups. Without this stage, logs arrive as raw unstructured text with no level or logger labels.

2. **`stage.template` (level normalization)**: The captured level character (`I`, `W`, `E`, `D`) is mapped to Loki's conventional level strings (`info`, `warning`, `error`, `debug`). This allows Grafana log panels to color-code lines by level and lets users filter with `{level="error"}` rather than needing to know the single-character codes.

3. **`stage.logfmt`**: The message content produced by the OTel Logback appender embeds `trace_id` and `span_id` as logfmt key-value pairs when MDC capture is enabled. This stage extracts them so they are available as structured fields.

4. **`stage.labels`**: Promotes `level`, `logger`, and `trace_id` from extracted fields to Loki index labels. `trace_id` as a label enables Grafana's trace-to-logs correlation: Tempo can link to the exact Loki stream for a given trace ID.

5. **`stage.output`**: Sets the final log line to just the message content, discarding the `jvm <pid> | ...` prefix that was needed for parsing but adds noise to the stored record.

## Kubernetes pipeline

On Kubernetes Alloy runs as a DaemonSet, one replica per node. Each instance reads pod logs for the pods scheduled on that node. The Kubernetes pipeline adds filtering logic to control log volume from non-Ignition workloads that share the cluster.

```alloy
discovery.kubernetes "pods" {
  role = "pod"
  selectors {
    role  = "pod"
    field = "spec.nodeName=" + coalesce(sys.env("HOSTNAME"), constants.hostname)
  }
}

discovery.relabel "pods" {
  targets = discovery.kubernetes.pods.targets

  rule {
    source_labels = ["__meta_kubernetes_pod_phase"]
    regex         = "Pending|Succeeded|Failed|Completed"
    action        = "drop"
  }
  rule {
    source_labels = ["__meta_kubernetes_namespace"]
    target_label  = "namespace"
  }
  rule {
    source_labels = ["__meta_kubernetes_pod_name"]
    target_label  = "pod"
  }
  rule {
    source_labels = ["__meta_kubernetes_pod_container_name"]
    target_label  = "container"
  }
  rule {
    source_labels = ["__meta_kubernetes_pod_node_name"]
    target_label  = "node_name"
  }
  rule {
    source_labels = ["__meta_kubernetes_pod_label_app_kubernetes_io_name", "__meta_kubernetes_pod_label_app", "__tmp_controller_name", "__meta_kubernetes_pod_name"]
    regex         = "^;*([^;]+)(;.*)?$"
    action        = "replace"
    target_label  = "app"
  }
}

loki.source.kubernetes "pods" {
  targets    = discovery.relabel.pods.output
  forward_to = [loki.process.default.receiver]
}
```

The `spec.nodeName` field selector is why Alloy runs as a DaemonSet: each pod only discovers and reads the pods on its own node, so there is no duplicate collection across replicas.

The `Pending|Succeeded|Failed|Completed` drop rule in `discovery.relabel` prevents Alloy from trying to tail logs from pods that are not in a running state, which would produce errors and retries without any useful data.

### Processing and filtering pipeline

```alloy
loki.process "default" {
  // Drop Loki's own pod logs — high volume, self-referential noise
  stage.match {
    selector = `{app="loki"}`
    action   = "drop"
  }

  // Drop Twingate operator non-error logs — operator is chatty at INFO level
  stage.match {
    selector = `{app=~"twingate.*"} !~ "(?i)(warn|error|fatal)"`
    action   = "drop"
  }

  // Drop backend-gateway non-error logs — keep only actionable signal
  stage.match {
    selector = `{app=~".*backend.*"} !~ "(?i)(WARN|ERROR|FATAL)"`
    action   = "drop"
  }

  // Aggregate multi-line entries (wrapper startup, JVM crash dumps)
  stage.multiline {
    firstline     = "^\\{|^\\d|^\\[|^[A-Z]{2,5}\\s"
    max_wait_time = "3s"
    max_lines     = 128
  }

  // Reformat JSON log lines from Ignition's logback JsonEncoder
  // Scoped to the namespace where the gateway runs
  stage.match {
    selector = `{namespace="public-demo"} |~ "^{"`

    stage.json {
      expressions = {
        level     = "level",
        timestamp = "timestamp",
        msg       = "message",
        logger    = "loggerName",
        thread    = "threadName",
        throwable = "throwable",
      }
    }

    stage.labels {
      values = {
        level = "",
      }
    }

    stage.timestamp {
      source = "timestamp"
      format = "unix_ms"
    }

    stage.template {
      source   = "output_line"
      template = `{{ .level }} [{{ .thread }}] {{ .logger }} - {{ .msg }}{{ if .throwable }}\n{{ .throwable }}{{ end }}`
    }

    stage.output {
      source = "output_line"
    }
  }

  forward_to = [loki.write.default.receiver]
}

loki.write "default" {
  endpoint {
    url = "https://loki.your-domain.com/loki/api/v1/push"
  }
}
```

Filter and processing rationale:

1. **Drop Loki's own logs**: Loki writes internal debug and scrape logs that are high volume and have no actionable content for gateway operators. Keeping them would inflate Loki storage and add noise to log queries.

2. **Drop Twingate operator non-errors**: The Twingate VPN operator is chatty at INFO level, logging connectivity probes and status checks continuously. Only warnings and errors carry actionable signal. This drop rule reduces log volume significantly in clusters using Twingate without losing any information that would affect an alert or investigation.

3. **Drop backend-gateway non-errors**: In the public-demo architecture, `backend` pods that run Ignition gateway instances in a non-primary role generate verbose INFO logs during normal operation. Keeping only WARN/ERROR/FATAL entries retains the signal an on-call engineer needs while substantially reducing storage costs.

4. **Multiline aggregation**: Ignition's JVM process emits multi-line log entries for gateway startup (which prints configuration tables), JVM crash dumps, and exception stack traces. Without multiline aggregation each physical line becomes a separate Loki log entry, making stack traces impossible to query as a unit. The `firstline` pattern matches the start of a JSON object (`{`), a timestamp-prefixed line, a bracket-prefixed line, or an uppercase-word prefix (common Tanuki Wrapper format). The `max_wait_time` of 3 s and `max_lines` of 128 bound memory use during collection spikes.

5. **JSON parsing (logback JsonEncoder)**: When the Ignition gateway is configured to use logback's `JsonEncoder`, log lines arrive as JSON objects with fields like `level`, `timestamp`, `message`, `loggerName`, and `throwable`. The `stage.json` block extracts these fields so `level` can become a Loki label and so the output line can be reformatted into a human-readable string. The `stage.match` selector `|~ "^{"` ensures this processing only applies to lines that are JSON objects, so it does not corrupt plain-text log lines from other containers in the same namespace. The namespace selector (`namespace="public-demo"`) further scopes it to avoid applying logback field names to containers with a different JSON schema.

6. **Timestamp extraction**: The `stage.timestamp` block with `format = "unix_ms"` tells Loki to use the timestamp embedded in the JSON log record rather than the collection time. This matters when there is lag between log emission and collection, and it prevents out-of-order ingestion errors when the gateway emits log bursts during startup.
