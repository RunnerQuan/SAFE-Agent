# Terraform セキュリティチェックリスト

## ステート管理

- [ ] リモートバックエンド使用（ローカルステート禁止）
- [ ] ステートファイル暗号化有効
- [ ] バージョニング有効（S3/GCS）
- [ ] ロック機構有効（DynamoDB/GCS）
- [ ] ステートバケットのパブリックアクセスブロック

## シークレット管理

- [ ] ハードコードされたシークレットなし
- [ ] .tfvars ファイルが .gitignore に含まれている
- [ ] センシティブ変数に `sensitive = true` 設定
- [ ] センシティブ出力に `sensitive = true` 設定
- [ ] Secrets Manager / Parameter Store 使用

```hcl
# NG: ハードコード
variable "db_password" {
  default = "password123"
}

# OK: 環境変数から取得
variable "db_password" {
  sensitive = true
}

# OK: Secrets Managerから取得
data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = "prod/db/password"
}
```

## IAM / アクセス制御

- [ ] 最小権限の原則を適用
- [ ] ワイルドカード権限を避ける
- [ ] リソースベースのポリシー使用
- [ ] OIDC によるクレデンシャルレス認証（CI/CD）

```hcl
# NG: 過剰な権限
resource "aws_iam_policy" "bad" {
  policy = jsonencode({
    Statement = [{
      Effect   = "Allow"
      Action   = "*"
      Resource = "*"
    }]
  })
}

# OK: 最小権限
resource "aws_iam_policy" "good" {
  policy = jsonencode({
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject", "s3:PutObject"]
      Resource = "arn:aws:s3:::my-bucket/*"
    }]
  })
}
```

## ネットワーク

- [ ] デフォルトVPCを使用しない
- [ ] セキュリティグループで 0.0.0.0/0 を避ける
- [ ] プライベートサブネットを適切に使用
- [ ] VPCエンドポイントでパブリックインターネット経由を避ける
- [ ] ネットワークACLで追加防御

```hcl
# NG: 全開放
resource "aws_security_group_rule" "bad" {
  type        = "ingress"
  from_port   = 22
  to_port     = 22
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]  # 全世界からSSH
}

# OK: 特定IPのみ
resource "aws_security_group_rule" "good" {
  type        = "ingress"
  from_port   = 22
  to_port     = 22
  protocol    = "tcp"
  cidr_blocks = ["10.0.0.0/8"]  # 内部ネットワークのみ
}
```

## 暗号化

- [ ] S3バケットのサーバーサイド暗号化
- [ ] RDS / データベースの暗号化
- [ ] EBS ボリュームの暗号化
- [ ] 転送中のデータ暗号化（HTTPS/TLS）
- [ ] KMS キーの適切なローテーション

```hcl
resource "aws_s3_bucket_server_side_encryption_configuration" "example" {
  bucket = aws_s3_bucket.example.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.example.arn
    }
  }
}

resource "aws_db_instance" "example" {
  storage_encrypted = true
  kms_key_id        = aws_kms_key.example.arn
  # ...
}
```

## ロギング / 監査

- [ ] CloudTrail 有効
- [ ] VPC Flow Logs 有効
- [ ] S3 アクセスログ有効
- [ ] CloudWatch Logs / アラーム設定
- [ ] Config Rules で継続的コンプライアンス

## リソース保護

- [ ] 重要リソースに `prevent_destroy = true`
- [ ] 削除保護の有効化（RDS, DynamoDB等）
- [ ] バックアップ設定

```hcl
resource "aws_db_instance" "example" {
  deletion_protection = true
  
  lifecycle {
    prevent_destroy = true
  }
}
```

## コード品質

- [ ] `terraform fmt` 実行
- [ ] `terraform validate` 成功
- [ ] tfsec スキャン通過
- [ ] checkov スキャン通過
- [ ] PRレビュー必須

## CI/CD セキュリティ

- [ ] OIDC でクレデンシャルレス認証
- [ ] plan 出力に機密情報なし
- [ ] 承認ゲート（production）
- [ ] 監査ログ保存
- [ ] ロールバック手順文書化

## 定期レビュー

- [ ] 未使用リソースの削除
- [ ] セキュリティグループルールの見直し
- [ ] IAM ポリシーの見直し
- [ ] プロバイダ / モジュールの更新
- [ ] ドリフト検出と是正
