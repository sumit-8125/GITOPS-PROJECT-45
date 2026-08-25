module "network" {
  source = "./modules/network"

  project_name       = var.project_name
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  azs                = var.azs
  public_subnets     = var.public_subnets
  private_app_subnets = var.private_app_subnets
  private_db_subnets = var.private_db_subnets
}

module "eks" {
  source = "./modules/eks"

  project_name        = var.project_name
  environment         = var.environment
  cluster_name        = "${var.project_name}-${var.environment}"
  cluster_version     = var.eks_version
  vpc_id              = module.network.vpc_id
  private_subnet_ids  = module.network.private_app_subnet_ids
  node_instance_types = var.node_instance_types
  desired_size        = var.node_desired_size
  min_size            = var.node_min_size
  max_size            = var.node_max_size
}

module "ecr" {
  source = "./modules/ecr"

  repositories = {
    frontend = "${var.project_name}/frontend"
    backend  = "${var.project_name}/backend"
  }
}

module "rds" {
  source = "./modules/rds"

  project_name        = var.project_name
  environment         = var.environment
  vpc_id              = module.network.vpc_id
  db_subnet_ids       = module.network.private_db_subnet_ids
  app_security_group  = module.network.app_security_group_id
  db_name             = var.db_name
  instance_class      = var.db_instance_class
  multi_az            = var.db_multi_az
}

module "secrets" {
  source = "./modules/secrets"

  secret_name = var.secret_name
}

module "iam" {
  source = "./modules/iam"

  project_name        = var.project_name
  environment         = var.environment
  github_org          = var.github_org
  frontend_repo       = var.frontend_repo
  backend_repo        = var.backend_repo
  terraform_repo      = var.terraform_repo
  github_branch       = var.github_branch

  github_oidc_url     = "https://token.actions.githubusercontent.com"
  github_oidc_audience = "sts.amazonaws.com"

  ecr_frontend_arn    = module.ecr.repository_arns["frontend"]
  ecr_backend_arn     = module.ecr.repository_arns["backend"]
  terraform_region    = var.aws_region

  eks_oidc_issuer_url = module.eks.oidc_issuer_url
  eks_oidc_arn        = module.eks.oidc_provider_arn
  secrets_arn         = module.secrets.secret_arn
}
