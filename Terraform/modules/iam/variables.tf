variable "project_name" { type = string }
variable "environment" { type = string }

variable "github_org" { type = string }
variable "frontend_repo" { type = string }
variable "backend_repo" { type = string }
variable "terraform_repo" { type = string }
variable "github_branch" { type = string }

variable "github_oidc_url" { type = string }
variable "github_oidc_audience" { type = string }

variable "ecr_frontend_arn" { type = string }
variable "ecr_backend_arn" { type = string }
variable "terraform_region" { type = string }

variable "eks_oidc_issuer_url" { type = string }
variable "eks_oidc_arn" { type = string }
variable "secrets_arn" { type = string }
