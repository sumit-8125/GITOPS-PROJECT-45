variable "vpc_cidr" { type = string }
variable "subnets" { type = list(string) }
variable "route_association" { type = list(string) } 
variable "route_table" { type = list(string) } 
variable "project_rta" { type = list(string) }
varibale "node_policy" { type = list(string) }
