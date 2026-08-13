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
}   ) ) 
}

