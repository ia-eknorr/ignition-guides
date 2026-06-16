# Content Backlog

This is the deferred content backlog from the 2026-06-15 DevOps content venture for `ignition-guides`. Each item here was researched and catalogued but deferred beyond round one. All items slot into the existing information architecture (Guides -> Kubernetes pillar, Guides -> Observability pillar, Reference, Labs) without requiring any taxonomy changes. Round-one content (R1) is being built in parallel phases; this file tracks everything marked **B** (backlog) in the design catalog so later rounds can execute without re-deciding structure.

---

## Observability Guides (Backlog)

These are full multi-section guide pages destined for the `docs/guides/observability/` pillar.

| Destination page path | Shape | Source pointer |
|---|---|---|
| `docs/guides/observability/traces-and-profiling.md` | Guide | `dawg-architecture-lab/observability-stack/config_files/tempo-config.yaml`, `pyroscope-config.yaml`, `alloy-config.alloy` (span metrics + Pyroscope continuous profiling) |
| `docs/guides/observability/external-exporters.md` | Guide | `dawg-architecture-lab/dev-docker/docker-compose.yml`, `jmx-exporter/kafka-jmx-config.yaml`, `observability-stack/config_files/remote_templates/` (DB/Kafka JMX/OS exporters; remote Alloy for bare-metal hosts) |
| `docs/guides/observability/custom-ignition-metrics.md` | Guide | `dawg-architecture-lab/observability-stack/ignition_scripts/metrics_push.py`, `experimental/exporter.py` (Pushgateway timer script + WebDev metrics endpoint + Flask exporter) |
| `docs/guides/observability/in-cluster.md` | Guide | `publicdemo-k8s/charts/public-demo/templates/otel-instrumentation.yaml`, `charts/kube-prometheus-stack/` (kube-prometheus-stack + OTel operator `Instrumentation` CRD auto-inject) |

---

## Kubernetes Guide (Backlog)

| Destination page path | Shape | Source pointer |
|---|---|---|
| `docs/guides/kubernetes/kargo-promotion.md` | Guide | `publicdemo-k8s/` (polling via ArgoCD image updater) + `conf-proveit26-platform/charts/kargo/` (webhook variant); `.internal/plans/2025-01-19-kargo-webhook-integration-design.md` |

---

## Labs (Backlog)

| Destination page path | Shape | Source pointer |
|---|---|---|
| `docs/labs/observability-lab.md` | Lab | `dawg-architecture-lab/observability-stack/docker-compose.yml` + full `config_files/` tree (end-to-end: stand up LGTM stack, wire a gateway, observe metrics/traces/logs/profiles) |

---

## Reference (Backlog)

| Destination page path | Shape | Source pointer |
|---|---|---|
| `docs/reference/ignition-metrics-inventory.md` | Reference | `publicdemo-k8s/charts/public-demo/templates/pod-monitor.yaml` (keep/drop relabel rules listing `ignition_*`, `perspective_*`, `databases_*`, jvm, process prefixes); `dawg-architecture-lab/dawg/configuration/metrics.py` |

---

## How-to (Tasks) Backlog -- Kubernetes Pillar

One-screen standalone pages destined for `docs/guides/kubernetes/` (collected under a "Tasks" sub-section as the pillar grows, following the Kubernetes-docs convention).

| Destination page path | Shape | Source pointer |
|---|---|---|
| `docs/guides/kubernetes/tasks/sync-wave-ordering.md` | How-to (Tasks) | `conf-proveit26-platform/appsets/appset-dev.yaml` (ArgoCD sync-wave annotations controlling bootstrap order) |
| `docs/guides/kubernetes/tasks/pvc-retention.md` | How-to (Tasks) | `publicdemo-k8s/charts/public-demo/values.yaml`, `conf-proveit26-platform/` (PVC retention policy for safe gateway decommission) |
| `docs/guides/kubernetes/tasks/applicationset-cleanup.md` | How-to (Tasks) | `conf-proveit26-platform/appsets/appset-dev.yaml` (`create-delete` auto-cleanup for decommissioning) |
| `docs/guides/kubernetes/tasks/gan-ca-sharing.md` | How-to (Tasks) | `publicdemo-k8s/` (GAN CA cert sharing across gateways; concept links to docs.ia.io) |
| `docs/guides/kubernetes/tasks/alb-sticky-sessions.md` | How-to (Tasks) | `publicdemo-k8s/charts/public-demo/values.yaml` (ALB target-group-binding + stickiness annotations for Ignition Designer/sessions) |
| `docs/guides/kubernetes/tasks/leased-licensing.md` | How-to (Tasks) | `publicdemo-k8s/charts/public-demo/values.yaml`, `conf-proveit26-platform/charts/site/` (leased-license secret + `terminate-on-shutdown` JVM arg; license concept links to docs.ia.io) |
| `docs/guides/kubernetes/tasks/github-webhook-argocd.md` | How-to (Tasks) | `conf-proveit26-platform/` (GitHub webhook -> instant ArgoCD sync instead of 3-min poll) |
| `docs/guides/kubernetes/tasks/kargo-rbac-claims.md` | How-to (Tasks) | `publicdemo-k8s/charts/kargo-publicdemo/templates/serviceaccount.yaml` (Kargo RBAC claims for promotion authorization) |
| `docs/guides/kubernetes/tasks/kargo-stage-colors.md` | How-to (Tasks) | `conf-proveit26-platform/charts/kargo/` (Kargo stage color conventions for environment visualization) |
| `docs/guides/kubernetes/tasks/kargo-webhook-workaround.md` | How-to (Tasks) | `conf-proveit26-platform/.internal/issues/kargo-1.9.2-webhook-cache-bug.md` (1.9.2 ClusterConfig webhook cache workaround) |
| `docs/guides/kubernetes/tasks/gateway-naming-race.md` | How-to (Tasks) | `conf-proveit26-platform/.internal/issues/gateway-naming.md`, `docs/DEPLOYMENT_TIMING.md` (config-sync vs commissioning naming race condition + mitigation) |
| `docs/guides/kubernetes/tasks/idempotent-site-provisioning.md` | How-to (Tasks) | `conf-proveit26-platform/scripts/commission-site/add-site.sh` (idempotent `add-site.sh` adds missing envs only) |
| `docs/guides/kubernetes/tasks/pgbouncer-pooling.md` | How-to (Tasks) | `conf-proveit26-platform/charts/pgo/` (PgBouncer connection pooling in front of PGO-managed Postgres for Ignition) |

---

## How-to (Tasks) Backlog -- Observability Pillar

One-screen standalone pages destined for `docs/guides/observability/` (collected under a "Tasks" sub-section as the pillar grows).

| Destination page path | Shape | Source pointer |
|---|---|---|
| `docs/guides/observability/tasks/cadvisor-docker.md` | How-to (Tasks) | `dawg-architecture-lab/observability-stack/docker-compose.yml` (cAdvisor for Docker host/container metrics) |
| `docs/guides/observability/tasks/blackbox-probes.md` | How-to (Tasks) | `publicdemo-k8s/charts/blackbox-exporter/templates/` (blackbox synthetic endpoint probes + PrometheusRule alerts) |
| `docs/guides/observability/tasks/grafana-dashboard-configmap.md` | How-to (Tasks) | `publicdemo-k8s/values/kube-prometheus-stack/` (dashboard-as-ConfigMap autodiscovery via `grafana.sidecar.dashboards`) |
| `docs/guides/observability/tasks/pyroscope-self-profiling.md` | How-to (Tasks) | `dawg-architecture-lab/observability-stack/config_files/pyroscope-config.yaml` (`self_profiling.disable_push` to avoid contention) |
| `docs/guides/observability/tasks/manual-method-instrumentation.md` | How-to (Tasks) | `dawg-architecture-lab/dev-docker/config_files/otel-agent.properties` (`otel.instrumentation.methods.include` targeting tag hot-paths); `publicdemo-k8s/` corroborates |
| `docs/guides/observability/tasks/questdb-historian-metrics.md` | How-to (Tasks) | `dawg-architecture-lab/observability-stack/docker-compose.yml` (QuestDB `server.conf`: `pg.enabled`, `metrics.enabled` for Core Historian metrics) |
| `docs/guides/observability/tasks/podmonitor-metric-filtering.md` | How-to (Tasks) | `publicdemo-k8s/charts/public-demo/templates/pod-monitor.yaml` (PodMonitor relabel rules: keep `ignition_*`, `perspective_*`, `databases_*`, jvm, process; drop high-cardinality per-session metrics) |

---

## Future Ideas

These items have been explicitly deferred with no committed timeline. They are captured here so the decision context is not lost.

### Keycloak on Kubernetes (in-cluster deploy glue)

The official [inductiveautomation.com Keycloak article](https://inductiveautomation.com/resources/article/using-keycloak-with-ignition) already covers the Docker deploy, realm/client configuration, Ignition OIDC setup, 2FA, and LDAP. A page here would duplicate ~90% of that. The only novel content would be the in-cluster Kubernetes deploy glue the official article omits: a Keycloak StatefulSet deployment and ALB sticky sessions for session affinity.

If this is ever written, the destination would be `docs/guides/kubernetes/tasks/keycloak-on-k8s.md` (How-to page in the Kubernetes Tasks sub-section), leading with a link to the official article and covering only the K8s-specific delta.

Source: `conf-proveit26-platform/charts/keycloak/` (StatefulSet + service config); `publicdemo-k8s/` (ALB sticky-session annotations).

### Platform components (Headlamp, n8n, PGO)

These are adjacent platform choices that appear in the source repos but are not Ignition-integration patterns per se. They could become an "Integrations" or "Platform" theme if enough content accumulates.

- **Headlamp**: in-cluster Kubernetes UI. Source: `conf-proveit26-platform/charts/headlamp/`.
- **n8n**: workflow automation adjacent to Ignition data pipelines. Source: `conf-proveit26-platform/charts/n8n/`.
- **PGO (CrunchyData Postgres Operator)**: in-cluster Postgres for Ignition's database backend. Source: `conf-proveit26-platform/charts/pgo/`. If ever written, the narrowest useful scope is a "Postgres for Ignition on Kubernetes" how-to page.

Revisit as an "Integrations" theme once the Kubernetes and Observability pillars are more complete.
