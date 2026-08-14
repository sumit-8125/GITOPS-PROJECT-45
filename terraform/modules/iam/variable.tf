variable "oidc_issuer_url" {
  type = string
}

variable "node_policy" {
type = map(object({
policy_arn = string 
}))
}
