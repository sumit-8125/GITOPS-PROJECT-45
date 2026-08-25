resource "aws_secretsmanager_secret" "backend" {
  name = var.secret_name
}
