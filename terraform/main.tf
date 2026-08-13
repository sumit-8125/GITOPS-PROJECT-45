modules "vpc" {
 source = "./modules/vpc"
 vpc_cidr = var.vpc_cidr
 subnets = var.subents 
 route_table = var.route_table

