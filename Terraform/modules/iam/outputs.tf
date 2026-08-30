output "github_frontend_role_arn" {
  value = aws_iam_role.github_frontend.arn
}

output "github_backend_role_arn" {
  value = aws_iam_role.github_backend.arn
}

output "github_terraform_role_arn" {
  value = aws_iam_role.github_terraform.arn
}

output "eso_role_arn" {
  value = aws_iam_role.eso.arn
}

output "alb_controller_role_arn" {
  value = aws_iam_role.alb_controller.arn
}

output "github_oidc_provider_arn" {
  value = aws_iam_openid_connect_provider.github.arn
}


