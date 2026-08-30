variable "aws_region" {
  type        = string
  description = "AWS region."
  default     = "ap-south-1"
}

variable "project_name" {
  type        = string
  description = "Project name."
  default     = "hitman-cloudflux"
}

variable "environment" {
  type        = string
  description = "Environment name."
  default     = "prod"
}

variable "vpc_cidr" {
  type        = string
  description = "VPC CIDR."
  default     = "10.0.0.0/16"
}

variable "azs" {
  type        = list(string)
  description = "Two availability zones."
  default     = ["ap-south-1a", "ap-south-1b"]
}

variable "public_subnets" {
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_app_subnets" {
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "private_db_subnets" {
  type        = list(string)
  default     = ["10.0.21.0/24", "10.0.22.0/24"]
}

variable "eks_version" {
  type        = string
  default     = "1.31"
}

variable "node_instance_types" {
  type        = list(string)
  default     = ["c7i-flex.large"]
}

variable "node_desired_size" {
  type    = number
  default = 2
}

variable "node_min_size" {
  type    = number
  default = 2
}

variable "node_max_size" {
  type    = number
  default = 4
}

variable "db_name" {
  type    = string
  default = "appdb"
}

variable "db_instance_class" {
  type        = string
  description = "RDS instance class."
  default     = "db.t4g.micro"

  validation {
    condition     = can(regex("^db\\.", var.db_instance_class))
    error_message = "The db_instance_class must start with 'db.' (e.g. 'db.t4g.micro', 'db.t3.micro', 'db.t4g.small')."
  }
}

variable "db_multi_az" {
  type    = bool
  default = false
}

variable "github_org" {
  type        = string
  description = "GitHub organization/user."
  default     = "sumit-8125"
}

variable "frontend_repo" {
  type        = string
  description = "Frontend repository name."
  default     = "GITOPS-PROJECT-45"
}

variable "backend_repo" {
  type        = string
  description = "Backend repository name."
  default     = "GITOPS-PROJECT-45"
}

variable "terraform_repo" {
  type        = string
  description = "Terraform repository name."
  default     = "GITOPS-PROJECT-45"
}

variable "github_branch" {
  type    = string
  default = "main"
}

variable "secret_name" {
  type    = string
  default = "hitman-cloudflux/prod/backend"
}
