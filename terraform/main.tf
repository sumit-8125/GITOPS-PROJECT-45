modules "vpc" {
 source = "./modules/vpc"
 vpc_cidr = var.vpc_cidr
 subnets = var.subents 
route_table = var.route_table
 route_association = var.route_association
project_rta = var.project_rta 
}

modules "iam" {
source = "./modules/iam"
node_policy = var.node_policy 
oidc_issuer_url = module.eks.oidc_issuer_url 
}




