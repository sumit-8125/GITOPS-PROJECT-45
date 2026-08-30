output "vpc_id" {
  value = module.network.vpc_id
}

output "eks_cluster_name" {
  value = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  value     = module.eks.cluster_endpoint
  sensitive = true
}

output "frontend_ecr_url" {
  value = module.ecr.repository_urls["frontend"]
}

output "backend_ecr_url" {
  value = module.ecr.repository_urls["backend"]
}

output "rds_endpoint" {
  value = module.rds.endpoint
}

output "rds_password" {
  value     = module.rds.password
  sensitive = true
}

output "backend_secret_arn" {
  value = module.secrets.secret_arn
}

output "github_frontend_role_arn" {
  value = module.iam.github_frontend_role_arn
}

output "github_backend_role_arn" {
  value = module.iam.github_backend_role_arn
}

output "github_terraform_role_arn" {
  value = module.iam.github_terraform_role_arn
}

output "eso_role_arn" {
  value = module.iam.eso_role_arn
}

output "alb_controller_role_arn" {
  value = module.iam.alb_controller_role_arn
}

output "ebs_csi_role_arn" {
  value = module.eks.ebs_csi_role_arn
}

