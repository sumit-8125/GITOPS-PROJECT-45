variable "node_policy" {
type = map(object({
role = string 
arn = string 
}))
}
