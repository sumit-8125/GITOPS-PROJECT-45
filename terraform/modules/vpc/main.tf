resource "aws_vpc" "project_vpc" {
 cidr_block = var.vpc_cidr 
 enable_dns_hostnames = true 
enable_dns_support = true 
}

resource "aws_internet_gateway" "project_igw" {
 vpc_id = aws_vpc.project_vpc.id
 }

## for_each with map(object()) 

resource "aws_subnet" "project_subnets" {
for_each = var.subnets
cidr_block = each.value.cidr_subnet
availability_zone = each.value.AZs
vpc_id = aws_vpc.project_vpc.id
tags = {
Name = "gitops-${each.key}"
}
}

resource "aws_eip" "for_nat" { 
availability_zone = "ap-south-1a"
domain = "vpc"
tags {
Name = "gitops-eip"
}
}

resource "aws_nat_gateway" "project_nat" {
availability_zone = "ap-south-1a" 
allocation_id = aws_eip.for_nat.id 
subnet_id = aws_subnet.project_subnets["public-a"].id
tags = {
Name = "gitops-nat-gateway"
}
}

## use dynamic + conditional approach to make multiple route table and  add route 

resource "aws_route_table" "for_project" {
for_each = var.route_table 
vpc_id = aws_vpc.project_vpc.id

dynamic "route" { 
for_each = each.value.gateway_id != null ? [1] : []

content {
cidr_block = each.value.cidr_block 
gateway_id = each.value.gateway_id }
}


dynamic "route" {
for_each = each.value.nat_gateway_id != null ? [1] : []

content {
cidr_block = each.value.cidr_block 
nat_gatway_id = each.value.nat_gateway_id }
}
}


resource "aws_route_table_association" "project_rta" {
for_each = var.route_association 
subnet_id = aws_subnet.project_subnets[each.value.subnet_key].id
route_table_id = aws_route_table[each.value.route_table_key].id 
}


