


### role for eks-cluster

data "aws_iam_policy_document" "eks_cluster_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["eks.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "cluster_role" {
name = "gitops-cluster-eks-role"
assume_role_policy = data.aws_iam_policy_document.eks_cluster_assume_role.json
tags = {
Name = "gitops-cluster-eks-role"
 }
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
role = aws_iam_role.cluster_role.name
policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}


### role for worker-nodes


data "aws_iam_policy_document" "eks_node_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}


resource "aws_iam_role" "worker_node_role" {
name = "gitops-worker-node-role"
assume_role_policy = data.aws_iam_policy_document.eks_node_assume_role.json
tags = {
Name = "gitops-worker-node-iam-role" 
}
}

resource "aws_iam_role_policy_attachment" "eks_node_policy" {
for_each = var.node_policy 
role = aws_iam_role.worker_node_role.name
policy_arn = each.value.policy_arn
 }



/*  oidc provider 
 1. EKS Cluster create
        ↓
2. EKS ek OIDC issuer URL provide karta hai
        ↓
3. Terraform us URL ko read karta hai
        ↓
4. tls_certificate us URL ka TLS certificate read karta hai
        ↓
5. Certificate ka fingerprint milta hai
        ↓
6. IAM OIDC Provider create hota hai
*/ 


data "tls_certificate" "eks" {
  url = var.oidc_issuer_url
}

resource "aws_iam_openid_connect_provider" "eks" {
  url = var.oidc_issuer_url

  client_id_list = [
    "sts.amazonaws.com"
  ]

  thumbprint_list = [
    data.tls_certificate.eks.certificates[0].sha1_fingerprint
  ]
}
