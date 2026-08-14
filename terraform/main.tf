modules "vpc" {
 source = "./modules/vpc"
 vpc_cidr = var.vpc_cidr
 subnets = var.subnets 
route_table = var.route_table
 route_association = var.route_association

}

modules "iam" {
source = "./modules/iam"
node_policy = var.node_policy 
oidc_issuer_url = module.eks.oidc_issuer_url 
}




