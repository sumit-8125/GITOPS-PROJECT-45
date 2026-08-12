resource "aws_vpc" "project_vpc" {
 cidr_block = var.vpc_cidr 
 enable_dns_hostnames = true 
enable_dns_support = true 
}

resource "aws_internet_gateway" "project_igw" {
 vpc_id = aws_vpc.project_vpc.id
 }

resource "aws_subnet" "project_subnets" {
for_each = var.subnets
cidr_block = var.cidr_subnet
availability_zone = var.AZs
vpc_id = aws_vpc.project_vpc.id

tags = {
name = "gitops-$(each.key)"
}
}
