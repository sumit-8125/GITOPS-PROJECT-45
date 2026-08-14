variable "vpc_cidr" {
type = string 
}

variable "subnets" {
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
subnet_key = string 
route_table_key = string 
}))
}





