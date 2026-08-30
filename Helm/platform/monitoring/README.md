# CloudFlux Monitoring & Observability Stack

This folder contains the complete Observability stack setup for the **CloudFlux GitOps Platform** running on Amazon EKS.

---

## 🎯 Architecture Summary

| Component | Responsibility | Specifications |
| :--- | :--- | :--- |
| **Prometheus** | Metrics Collection & TSDB | 15-day data retention (`retention: 15d`), AWS EBS CSI persistent volume, scraping nodes/pods/services |
| **Grafana** | Visualization & Dashboards | Auto-provisioned Prometheus datasource, preloaded CloudFlux Overview Dashboard, EBS storage |
| **Alertmanager** | Alert Routing & Notifications | Slack alerts routing to `#alerts` channel, grouped notifications, deduplication |
| **PrometheusRules** | Custom Alert Definitions | `crash-loop`, `high memory` (> 85%), `replica mismatch` |
| **ServiceMonitors** | Endpoint Scrapers | Automated scraping for `backend` and `frontend` microservices |
| **CloudWatch** | Control Plane Logging | AWS EKS logs (`api`, `audit`, `authenticator`) |

---

## 📦 Components & Files

- `Helm/platform/helm-values/kube-prometheus-stack-values.yaml`: Helm values for `kube-prometheus-stack` chart.
- `Helm/platform/monitoring/prometheus-rules.yaml`: PrometheusRule defining `PodCrashLooping`, `ContainerHighMemoryUsage`, `NodeHighMemoryUsage`, `DeploymentReplicaMismatch`, `DeploymentReplicasUnavailable`.
- `Helm/platform/monitoring/servicemonitors.yaml`: ServiceMonitors targeting `backend` and `frontend` services.
- `Helm/platform/monitoring/alertmanager-slack-secret.yaml`: Secret template for Slack Webhook URL.
- `Helm/platform/monitoring/grafana-dashboard-configmap.yaml`: Pre-configured Grafana dashboard JSON.
- `Helm/argocd/monitoring-application.yaml`: ArgoCD Application manifest for automated GitOps deployment.

---

## 🛠️ Step-by-Step Setup Guide

### 1. Ensure `monitoring` Namespace Exists
```bash
kubectl apply -f Helm/bootstrap/namespaces.yaml
```

### 2. Configure Slack Webhook for Alertmanager
1. Go to Slack -> Manage Apps -> **Incoming WebHooks**.
2. Add New Webhook to your `#alerts` channel and copy the webhook URL.
3. Update `Helm/platform/helm-values/kube-prometheus-stack-values.yaml`:
   ```yaml
   slack_api_url: "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK_URL"
   ```
   Or apply the secret:
   ```bash
   kubectl apply -f Helm/platform/monitoring/alertmanager-slack-secret.yaml
   ```

### 3. Deploy the Monitoring Stack

#### Option A: Via ArgoCD (GitOps - Recommended)
```bash
kubectl apply -f Helm/argocd/monitoring-application.yaml
```

#### Option B: Via Helm CLI
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --values Helm/platform/helm-values/kube-prometheus-stack-values.yaml

# Apply custom rules, service monitors, and dashboard
kubectl apply -f Helm/platform/monitoring/
```

---

## 🖥️ Accessing UIs

### 1. Grafana Dashboard
```bash
kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3000:80
```
- Open in browser: `http://localhost:3000`
- **Default Username:** `admin`
- **Default Password:** `prom-operator` (or value set in `kube-prometheus-stack-values.yaml`)
- Open the **CloudFlux GitOps Platform Overview** dashboard under Dashboards.

### 2. Prometheus UI
```bash
kubectl port-forward -n monitoring svc/kube-prometheus-stack-prometheus 9090:9090
```
- Open in browser: `http://localhost:9090`
- Check Status -> **Targets** to verify that backend, frontend, and cluster components are healthy (`UP`).
- Check Status -> **Rules** to view the active CloudFlux alerting rules.

### 3. Alertmanager UI
```bash
kubectl port-forward -n monitoring svc/kube-prometheus-stack-alertmanager 9093:9093
```
- Open in browser: `http://localhost:9093`
- Inspect active and suppressed alerts and receiver status.

---

## 🧪 Testing & Verifying Alerts

### 1. Test `crash-loop` Alert (PodCrashLooping)
Deploy a deliberately crashing container to verify the alert triggers:
```bash
kubectl run test-crashloop --image=busybox --namespace=backend --restart=Always -- /bin/sh -c "exit 1"
```
- **Expected Result:** Within 2 minutes, the alert `PodCrashLooping` fires in Prometheus and sends a notification to the Slack `#alerts` channel.
- **Cleanup:**
  ```bash
  kubectl delete pod test-crashloop --namespace=backend
  ```

### 2. Test `replica mismatch` Alert (DeploymentReplicaMismatch)
Scale the backend deployment to 0 replicas or simulate an unsatisfied replica schedule:
```bash
kubectl scale deployment backend --replicas=0 --namespace=backend
```
- **Expected Result:** Prometheus rule `DeploymentReplicaMismatch` flags the difference and alerts.
- **Cleanup:**
  ```bash
  kubectl scale deployment backend --replicas=2 --namespace=backend
  ```
