"""
Exposes GET /metrics in Prometheus text format, using prometheus-flask-exporter.

This is what makes prometheus_client.py's queries return real numbers —
Prometheus can only report on http_requests_total / http_request_duration_seconds
if something is actually recording them. Without this, PromQL queries in
prometheus_client.py simply return no data.

Also requires a ServiceMonitor (see helm/cloudflux/templates/servicemonitor.yaml)
so kube-prometheus-stack's Prometheus actually discovers and scrapes this pod.
"""
from prometheus_flask_exporter import PrometheusMetrics


def init_metrics(app):
    metrics = PrometheusMetrics(app, path="/metrics")
    metrics.info("cloudflux_backend_info", "CloudFlux backend build info", version="1.0.0")
    return metrics
