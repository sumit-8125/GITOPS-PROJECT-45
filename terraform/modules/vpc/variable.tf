variable "vpc_cidr" {
type = string 
}

variable "subents" {
 type = map(object({
 cidr_subnet = string 
AZs = string 
type = string 
}

variable "route_table" {
type = map(object({
cidr_block = string 
gateway_id = optional(string) 
nat_gateway_id = optional(string) 
}  ) ) 
}


variable "route_association" {
type = map(object({
subent_key = string 
route_table_key = string 
}))
}


variable "sg_group" {
type = map(object({

ingress = list(object({
from_port = string 
to_port = string 
protocol = string 
cidr_block = string
}))

egress = list(object({
from_port = string 
to_port = string 
protocol = string 
cidr_block = string
}))
} ))
}



