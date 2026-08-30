# CloudFlux GitOps Platform — Helm & Manifests

This directory contains the Kubernetes manifests, Helm values, RBAC configurations, and ArgoCD application definitions for the CloudFlux GitOps Platform on AWS EKS.

---

## 📁 Directory Structure

```text
Helm/
├── bootstrap/
│   └── namespaces.yaml              # Creates namespaces: argocd, external-secrets, aws-load-balancer-controller, frontend, backend, monitoring
├── rbac/
│   ├── argocd.yaml                  # ClusterRole and permissions for ArgoCD (apps, external-secrets, monitoring.coreos.com)
│   ├── aws-load-balancer-controller.yaml
│   └── external-secrets.yaml
├── platform/
│   ├── helm-values/
│   │   ├── aws-load-balancer-controller-values.yaml
│   │   ├── external-secrets-values.yaml
│   │   └── kube-prometheus-stack-values.yaml    # Prometheus (15d retention), Grafana, Alertmanager (Slack #alerts)
│   ├── external-secrets/
│   │   └── clustersecretstore.yaml
│   └── monitoring/
│       ├── prometheus-rules.yaml                # crash-loop, high memory, replica mismatch alerts
│       ├── servicemonitors.yaml                 # Scrape configs for backend & frontend
│       ├── alertmanager-slack-secret.yaml       # Slack incoming webhook template
│       ├── grafana-dashboard-configmap.yaml     # Pre-loaded CloudFlux Overview Dashboard
│       └── README.md                            # Complete monitoring operations runbook
├── argocd/
│   ├── backend-application.yaml                 # ArgoCD app for backend microservice
│   ├── frontend-application.yaml                # ArgoCD app for frontend microservice
│   └── monitoring-application.yaml              # ArgoCD app for kube-prometheus-stack & rules
└── apps/
    ├── backend/                                 # Helm chart for backend (Go/Node/Python API)
    └── frontend/                                # Helm chart for frontend (React/Vite/Nginx UI)
```

---

## 🚀 Quick Start Deployment Workflow

### 1. Bootstrap Cluster Namespaces
```bash
kubectl apply -f Helm/bootstrap/namespaces.yaml
```

### 2. Apply ArgoCD RBAC
```bash
kubectl apply -f Helm/rbac/argocd.yaml
kubectl apply -f Helm/rbac/aws-load-balancer-controller.yaml
kubectl apply -f Helm/rbac/external-secrets.yaml
```

### 3. Deploy Platform Ingress & Secrets
```bash
# AWS Load Balancer Controller
helm repo add eks https://aws.github.io/eks-charts
helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n aws-load-balancer-controller \
  -f Helm/platform/helm-values/aws-load-balancer-controller-values.yaml

# External Secrets Operator
helm repo add external-secrets https://charts.external-secrets.io
helm upgrade --install external-secrets external-secrets/external-secrets \
  -n external-secrets \
  -f Helm/platform/helm-values/external-secrets-values.yaml

kubectl apply -f Helm/platform/external-secrets/clustersecretstore.yaml
```

### 4. Deploy Monitoring Stack (Prometheus + Grafana + Alertmanager)
```bash
# Deploy via ArgoCD (GitOps):
kubectl apply -f Helm/argocd/monitoring-application.yaml

# OR Deploy directly with Helm:
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  -n monitoring \
  -f Helm/platform/helm-values/kube-prometheus-stack-values.yaml

kubectl apply -f Helm/platform/monitoring/
```

### 5. Deploy Applications via ArgoCD
```bash
kubectl apply -f Helm/argocd/backend-application.yaml
kubectl apply -f Helm/argocd/frontend-application.yaml
```
