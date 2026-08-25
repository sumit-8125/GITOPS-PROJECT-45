# Terraform AWS Infrastructure

This structure covers the AWS infrastructure layer for the EKS project:

- VPC with public, private-app and private-db subnets across 2 AZs
- Single NAT Gateway (cost-optimized; use one per AZ for stronger HA)
- EKS cluster + managed node group
- EKS OIDC provider for workload IAM
- Frontend and backend ECR repositories
- PostgreSQL RDS
- Secrets Manager secret container
- GitHub OIDC provider + CI roles
- ESO IAM role
- AWS Load Balancer Controller IAM role

Not managed here:
- Frontend/backend Kubernetes Deployments, Services and Ingress
- ArgoCD Applications
- Helm application charts

Those belong to the Helm/ArgoCD layer.

## Important bootstrap note

The GitHub OIDC provider and `github-terraform-role` are intended to let GitHub Actions run Terraform.
The first creation of those bootstrap resources cannot depend on the GitHub Actions role itself.
Create the bootstrap identity once from an administrative/local Terraform run, then use GitHub OIDC for subsequent runs.
