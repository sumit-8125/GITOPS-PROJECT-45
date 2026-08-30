terraform {
  required_version = ">= 1.6.0"

  # Remote State Storage:
  # Agar aapne S3 bucket banaya hai, toh neeche wala backend block uncomment karke apna bucket name daal dein:
  # backend "s3" {
  #   bucket = "YOUR_UNIQUE_S3_BUCKET_NAME"
  #   key    = "hitman-cloudflux/prod/terraform.tfstate"
  #   region = "ap-south-1"
  # }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
    }
    random = {
      source  = "hashicorp/random"
    }
  }
}
