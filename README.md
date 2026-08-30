# CloudFlux GitOps Platform on AWS EKS

An enterprise-grade GitOps platform running on **AWS EKS**, managed declaratively with **Terraform**, deployed via **ArgoCD**, and secured with **External Secrets Operator** and **AWS OIDC**.

---

## 🏗️ Architecture Overview

```
                          ┌───────────────────────────┐
                          │   GitHub Actions (CI/CD)  │
                          │   (OIDC Authentication)   │
                          └─────────────┬─────────────┘
                                        │
                         Push Images ┌──┴──┐ Git Commit (SHA)
                                     ▼     ▼
             ┌─────────────────────────┐  ┌─────────────────────────┐
             │       Amazon ECR        │  │ GitOps Repository (Helm)│
             └───────────┬─────────────┘  └────────────┬────────────┘
                         │                             │
                         │ Pull Images                 │ Sync Manifests
                         ▼                             ▼
       ┌─────────────────────────────────────────────────────────────────┐
       │                       AWS EKS Cluster                           │
       │                                                                 │
       │  ┌──────────────────┐               ┌────────────────────────┐  │
       │  │  AWS LB Ingress  │               │      ArgoCD Engine     │  │
       │  └────────┬─────────┘               └────────────────────────┘  │
       │           │                                                     │
       │     ┌─────┴──────────────────┐                                  │
       │     ▼                        ▼                                  │
       │  ┌──────────────────────┐ ┌──────────────────────┐              │
       │  │ frontend (React/Vite)│ │  backend (Flask API) │              │
       │  │ (Port 80 -> 8080)    │ │  (Port 80 -> 5000)   │              │
       │  └──────────────────────┘ └──────────┬───────────┘              │
       │                                      │                          │
       │  ┌──────────────────────┐            ▼                          │
       │  │ External Secrets     │◄──── AWS Secrets Manager              │
       │  │ Operator (ESO)       │      (DB_URL, JWT, CORS)              │
       │  └──────────────────────┘                                       │
       │                                                                 │
       │  ┌───────────────────────────────────────────────────────────┐  │
       │  │ Monitoring: Prometheus (15d) + Grafana + Alertmanager     │  │
       │  └───────────────────────────────────────────────────────────┘  │
       └──────────────────────────────┬──────────────────────────────────┘
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │ AWS RDS (PostgreSQL)│
                           └─────────────────────┘
```

---

## 📁 Repository Structure

```text
.
├── .github/workflows/         # Automated CI/CD pipelines
│   ├── terraform.yaml         # Terraform plan & apply via AWS OIDC
│   ├── frontend.yaml          # Frontend build, ECR push & Helm tag update
│   └── backend.yaml           # Backend build, ECR push & Helm tag update
├── app/                       # Application source code
│   ├── backend/               # Python Flask API + PostgreSQL + Prometheus metrics
│   │   ├── app.py             # Main Flask application
│   │   ├── Dockerfile         # Production Python 3.12 image
│   │   ├── k8s_client.py      # Kubernetes in-cluster API client
│   │   ├── promql_client.py   # Prometheus metrics reader
│   │   ├── argocd_client.py   # ArgoCD sync status reader
│   │   └── db/schema.sql      # Database schema
│   └── frontend/              # React 19 + Vite SPA + Nginx
│       ├── src/               # React components and styling
│       ├── Dockerfile         # Multi-stage production build (Node -> Nginx)
│       └── nginx.conf         # Nginx SPA & reverse proxy configuration
├── Helm/                      # Kubernetes manifests and Helm charts
│   ├── apps/
│   │   ├── frontend/          # Helm chart for frontend (Deploy, Ingress, HPA)
│   │   └── backend/           # Helm chart for backend (Deploy, Ingress, HPA, ESO, RBAC)
│   ├── argocd/                # ArgoCD Application definitions
│   │   ├── frontend-application.yaml
│   │   ├── backend-application.yaml
│   │   └── monitoring-application.yaml
│   ├── bootstrap/             # Cluster bootstrap manifests
│   │   └── namespaces.yaml    # Namespaces: argocd, external-secrets, etc.
│   ├── platform/
│   │   ├── helm-values/       # Values for ALB Controller, ESO, Prometheus
│   │   ├── external-secrets/  # ClusterSecretStore definition
│   │   └── monitoring/        # Prometheus rules, ServiceMonitors, Grafana Dashboards
│   └── rbac/                  # ClusterRoles and ServiceAccounts
├── Terraform/                 # Infrastructure as Code (AWS)
│   ├── main.tf                # Root infrastructure wiring
│   ├── variables.tf           # Variable declarations
│   ├── terraform.tfvars       # Environment variables
│   └── modules/               # Reusable modules (vpc, eks, ecr, rds, secrets, iam)
└── SETUP_CONFIG_CHECKLIST.txt # Complete step-by-step configuration checklist
```

---

## 🚀 Deployment Guide

Follow the detailed steps in [SETUP_CONFIG_CHECKLIST.txt](file:///d:/project/HITMAN%20CLOUD%20FLUX/SETUP_CONFIG_CHECKLIST.txt) to deploy:

### 1. Provision Infrastructure with Terraform
```bash
cd Terraform
terraform init
terraform plan
terraform apply
```

### 2. Configure Local Kubernetes Context
```bash
aws eks update-kubeconfig --region ap-south-1 --name hitman-cloudflux-prod
```

### 3. Bootstrap Cluster & Namespaces
```bash
kubectl apply -f Helm/bootstrap/namespaces.yaml
kubectl apply -f Helm/rbac/argocd.yaml
kubectl apply -f Helm/rbac/aws-load-balancer-controller.yaml
kubectl apply -f Helm/rbac/external-secrets.yaml
```

### 4. Deploy Core Platform Controllers
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

### 5. Deploy Observability Stack & Applications via ArgoCD
```bash
# Observability
kubectl apply -f Helm/argocd/monitoring-application.yaml

# Applications
kubectl apply -f Helm/argocd/backend-application.yaml
kubectl apply -f Helm/argocd/frontend-application.yaml
```

---

## 💻 Local Development

### Run Backend
```bash
cd app/backend
python -m venv .venv
source .venv/bin/activate  # Or .venv\Scripts\activate on Windows
pip install -r requirements.txt
python app.py
# Backend runs at http://localhost:5000
```

### Run Frontend
```bash
cd app/frontend
npm install
npm run dev
# Frontend runs at http://localhost:5173
```

