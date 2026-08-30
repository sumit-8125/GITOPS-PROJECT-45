terraform {
  required_version = ">= 1.6.0"

  backend "s3" {
    bucket = "gitops-project-45-bucket"
    key    = "hitman-cloudflux/prod/terraform.tfstate"
    region = "ap-south-1"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
    }
    random = {
      source  = "hashicorp/random"
    }
  }
}
