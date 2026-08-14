# GITOPS-PROJECT-45



resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  role       = aws_iam_role.eks_node_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  role       = aws_iam_role.eks_node_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "ecr_read_only" {
  role       = aws_iam_role.eks_node_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}:






production-gitops-platform/
│
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── providers.tf
│   ├── terraform.tfvars
│   │
│   └── modules/
│       │
│       ├── vpc/
│       │   ├── main.tf
│       │   ├── variables.tf
│       │   └── outputs.tf
│       │
│       │   # main.tf:
│       │   # ├── aws_vpc
│       │   # ├── aws_subnet (2 public)
│       │   # ├── aws_subnet (2 private)
│       │   # ├── aws_internet_gateway
│       │   # ├── aws_eip
│       │   # ├── aws_nat_gateway (1)
│       │   # ├── aws_route_table (public)
│       │   # ├── aws_route_table (private AZ-1)
│       │   # └── aws_route_table (private AZ-2)
│       │
│       ├── iam/
│       │   ├── main.tf
│       │   ├── variables.tf
│       │   └── outputs.tf
│       │
│       │   # main.tf:
│       │   # ├── EKS Cluster IAM Role
│       │   ├── EKS Node IAM Role
│       │   ├── IAM Policy Attachments
│       │   ├── EKS OIDC Provider
│       │   ├── IRSA Role
│       │   └── GitHub Actions OIDC Role
│       │
│       ├── ecr/
│       │   ├── main.tf
│       │   ├── variables.tf
│       │   └── outputs.tf
│       │
│       │   # main.tf:
│       │   ├── aws_ecr_repository
│       │   ├── image_tag_mutability
│       │   ├── image_scan_on_push
│       │   └── lifecycle_policy
│       │
│       └── eks/
│           ├── main.tf
│           ├── variables.tf
│           └── outputs.tf
│
│           # main.tf:
│           ├── aws_eks_cluster
│           ├── aws_eks_node_group
│           ├── aws_eks_addon - VPC CNI
│           ├── aws_eks_addon - CoreDNS
│           └── aws_eks_addon - kube-proxy
