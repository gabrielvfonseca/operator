# @gabrielvfonseca/diagnostics-prometheus

Official Prometheus diagnostics exporter for Operator.

This plugin exposes Operator Gateway runtime metrics in Prometheus text format for Prometheus, Grafana, VictoriaMetrics, and compatible scrapers.

## Install

```bash
operator plugins install @gabrielvfonseca/diagnostics-prometheus
```

Restart the Gateway after installing or updating the plugin.

## Configure

Enable the plugin and set the scrape endpoint options in `plugins.entries.diagnostics-prometheus.config`.

The full config surface, metric names, and scrape examples live in the docs:

- https://docs.operator.ai/gateway/prometheus

## Package

- Plugin id: `diagnostics-prometheus`
- Package: `@gabrielvfonseca/diagnostics-prometheus`
- Minimum Operator host: `2026.4.25`
