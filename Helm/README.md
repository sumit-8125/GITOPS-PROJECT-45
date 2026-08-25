# CloudFlux GitOps
5 namespaces: argocd, external-secrets, aws-load-balancer-controller, frontend, backend.
Terraform creates AWS/IAM. Helm installs platform controllers. ArgoCD deploys frontend/backend Helm charts.
Replace ACCOUNT_ID, YOUR_GITHUB_ORG, domain and role ARNs before use.
