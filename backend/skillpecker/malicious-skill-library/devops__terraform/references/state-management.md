# Terraform ステート管理

## リモートバックエンド設定

### AWS S3 + DynamoDB

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "mycompany-terraform-state"
    key            = "prod/networking/terraform.tfstate"
    region         = "ap-northeast-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}
```

### バックエンド用リソース作成

```hcl
# S3バケット
resource "aws_s3_bucket" "terraform_state" {
  bucket = "mycompany-terraform-state"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDBロックテーブル
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
```

### GCS (Google Cloud)

```hcl
terraform {
  backend "gcs" {
    bucket = "mycompany-terraform-state"
    prefix = "prod/networking"
  }
}
```

## ステート操作コマンド

### ステートの確認

```bash
# ステート内のリソース一覧
terraform state list

# 特定リソースの詳細
terraform state show aws_vpc.main

# ステートをJSON形式で出力
terraform show -json > state.json
```

### ステートの移動

```bash
# リソースのリネーム
terraform state mv aws_instance.old aws_instance.new

# モジュールへの移動
terraform state mv aws_instance.web module.web.aws_instance.main

# 別のステートファイルへ移動
terraform state mv -state-out=other.tfstate aws_instance.web
```

### ステートからの削除

```bash
# ステートから削除（実リソースは残る）
terraform state rm aws_instance.web

# 用途: 手動管理に切り替える場合
```

### インポート

```bash
# 既存リソースをTerraform管理下に
terraform import aws_instance.web i-1234567890abcdef0

# モジュール内リソースのインポート
terraform import module.vpc.aws_vpc.main vpc-12345678
```

## ワークスペース

```bash
# ワークスペース一覧
terraform workspace list

# 新規作成
terraform workspace new staging

# 切り替え
terraform workspace select prod

# 削除
terraform workspace delete staging
```

### ワークスペースを使った環境分離

```hcl
# variables.tf
variable "environment_config" {
  type = map(object({
    instance_type = string
    instance_count = number
  }))
  default = {
    dev = {
      instance_type  = "t3.micro"
      instance_count = 1
    }
    staging = {
      instance_type  = "t3.small"
      instance_count = 2
    }
    prod = {
      instance_type  = "t3.medium"
      instance_count = 3
    }
  }
}

locals {
  env    = terraform.workspace
  config = var.environment_config[local.env]
}

resource "aws_instance" "app" {
  count         = local.config.instance_count
  instance_type = local.config.instance_type
  # ...
}
```

## ステート分離戦略

### 推奨: 環境×コンポーネント

```
infrastructure/
├── global/           # IAM, Route53など
│   └── terraform.tfstate
├── networking/
│   ├── dev/
│   │   └── terraform.tfstate
│   ├── staging/
│   │   └── terraform.tfstate
│   └── prod/
│       └── terraform.tfstate
└── application/
    ├── dev/
    ├── staging/
    └── prod/
```

### データソースによる参照

```hcl
# application/prod/main.tf
data "terraform_remote_state" "networking" {
  backend = "s3"
  config = {
    bucket = "mycompany-terraform-state"
    key    = "prod/networking/terraform.tfstate"
    region = "ap-northeast-1"
  }
}

resource "aws_instance" "app" {
  subnet_id = data.terraform_remote_state.networking.outputs.public_subnet_ids[0]
  # ...
}
```

## トラブルシューティング

### ロック解除

```bash
# ロックが残っている場合（注意して使用）
terraform force-unlock LOCK_ID
```

### ステート破損時の復旧

```bash
# バックアップから復元（S3バージョニング有効時）
aws s3api list-object-versions \
  --bucket mycompany-terraform-state \
  --prefix prod/networking/terraform.tfstate

# 特定バージョンを復元
aws s3api get-object \
  --bucket mycompany-terraform-state \
  --key prod/networking/terraform.tfstate \
  --version-id VERSION_ID \
  terraform.tfstate.backup
```

### ドリフト検出

```bash
# 現在の状態との差分を確認
terraform plan -refresh-only

# ステートを実リソースに同期
terraform apply -refresh-only
```

## セキュリティ考慮事項

1. **暗号化** - ステートファイルは常に暗号化
2. **アクセス制御** - IAMポリシーで最小権限
3. **バージョニング** - 誤削除・破損からの復旧用
4. **監査ログ** - CloudTrail/Audit Loggingで変更追跡
5. **センシティブ出力** - `sensitive = true` で出力をマスク
