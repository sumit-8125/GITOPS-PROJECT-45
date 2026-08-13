variable "vpc_cidr" { type = string }
variable "subnets" { type = list(string) }
variable "route_table" { type = list(string) } 
variable "project_rta" { type = list(string) }
