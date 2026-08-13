variable "node_policy" {
type = map(object({
role = string 
policy_arn = string 
}))
}
