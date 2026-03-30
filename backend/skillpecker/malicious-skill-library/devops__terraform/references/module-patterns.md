# Terraform モジュール設計パターン

## 基本構造

```hcl
# modules/networking/main.tf
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "${var.project}-vpc-${var.environment}"
  })
}

resource "aws_subnet" "public" {
  count             = length(var.public_subnets)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnets[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.common_tags, {
    Name = "${var.project}-public-${count.index + 1}"
    Type = "public"
  })
}
```

## 変数定義

```hcl
# modules/networking/variables.tf
variable "project" {
  description = "プロジェクト名"
  type        = string
}

variable "environment" {
  description = "環境名（dev/staging/prod）"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "環境は dev, staging, prod のいずれかである必要があります"
  }
}

variable "vpc_cidr" {
  description = "VPCのCIDRブロック"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnets" {
  description = "パブリックサブネットのCIDRリスト"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "common_tags" {
  description = "すべてのリソースに適用する共通タグ"
  type        = map(string)
  default     = {}
}
```

## 出力定義

```hcl
# modules/networking/outputs.tf
output "vpc_id" {
  description = "作成されたVPCのID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "パブリックサブネットIDのリスト"
  value       = aws_subnet.public[*].id
}

output "vpc_cidr_block" {
  description = "VPCのCIDRブロック"
  value       = aws_vpc.main.cidr_block
}
```

## モジュール呼び出し

```hcl
# environments/prod/main.tf
module "networking" {
  source = "../../modules/networking"

  project     = "myapp"
  environment = "prod"
  vpc_cidr    = "10.0.0.0/16"

  public_subnets = [
    "10.0.1.0/24",
    "10.0.2.0/24",
    "10.0.3.0/24"
  ]

  availability_zones = [
    "ap-northeast-1a",
    "ap-northeast-1c",
    "ap-northeast-1d"
  ]

  common_tags = {
    Project     = "myapp"
    Environment = "prod"
    ManagedBy   = "terraform"
  }
}

# 他のモジュールでVPC IDを参照
module "compute" {
  source = "../../modules/compute"

  vpc_id     = module.networking.vpc_id
  subnet_ids = module.networking.public_subnet_ids
}
```

## 条件分岐パターン

```hcl
# 環境に応じたリソース作成
resource "aws_cloudwatch_log_group" "app" {
  count = var.enable_logging ? 1 : 0

  name              = "/app/${var.environment}"
  retention_in_days = var.environment == "prod" ? 365 : 30
}

# for_eachによる動的リソース作成
resource "aws_security_group_rule" "ingress" {
  for_each = var.ingress_rules

  type              = "ingress"
  from_port         = each.value.from_port
  to_port           = each.value.to_port
  protocol          = each.value.protocol
  cidr_blocks       = each.value.cidr_blocks
  security_group_id = aws_security_group.main.id
}
```

## データソースの活用

```hcl
# 既存リソースの参照
data "aws_vpc" "existing" {
  filter {
    name   = "tag:Name"
    values = ["existing-vpc"]
  }
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# 現在のAWSアカウント情報
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
```

## バージョン制約

```hcl
# versions.tf
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}
```

## ベストプラクティス

1. **単一責任** - モジュールは一つの機能に集中
2. **明確なインターフェース** - 入出力を明確に定義
3. **デフォルト値** - 一般的な値はデフォルト設定
4. **バリデーション** - 入力値を検証
5. **ドキュメント** - description を必ず記載
6. **バージョニング** - セマンティックバージョニング使用
