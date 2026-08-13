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
