# Terraform CI/CD統合

## GitHub Actions

### PRでplanを実行

```yaml
# .github/workflows/terraform-plan.yml
name: Terraform Plan

on:
  pull_request:
    paths:
      - 'infrastructure/**'

env:
  TF_VERSION: '1.6.0'
  AWS_REGION: 'ap-northeast-1'

jobs:
  plan:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      id-token: write

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Terraform Format Check
        run: terraform fmt -check -recursive
        working-directory: infrastructure

      - name: Terraform Init
        run: terraform init
        working-directory: infrastructure/environments/prod

      - name: Terraform Validate
        run: terraform validate
        working-directory: infrastructure/environments/prod

      - name: Terraform Plan
        id: plan
        run: |
          terraform plan -no-color -out=tfplan 2>&1 | tee plan.txt
        working-directory: infrastructure/environments/prod
        continue-on-error: true

      - name: Comment Plan on PR
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const plan = fs.readFileSync('infrastructure/environments/prod/plan.txt', 'utf8');
            const truncated = plan.length > 65000 
              ? plan.substring(0, 65000) + '\n... (truncated)'
              : plan;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Terraform Plan\n\`\`\`\n${truncated}\n\`\`\``
            });

      - name: Plan Status
        if: steps.plan.outcome == 'failure'
        run: exit 1
```

### mainマージでapply

```yaml
# .github/workflows/terraform-apply.yml
name: Terraform Apply

on:
  push:
    branches:
      - main
    paths:
      - 'infrastructure/**'

jobs:
  apply:
    runs-on: ubuntu-latest
    environment: production  # 承認ゲート

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ap-northeast-1

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: '1.6.0'

      - name: Terraform Init
        run: terraform init
        working-directory: infrastructure/environments/prod

      - name: Terraform Apply
        run: terraform apply -auto-approve
        working-directory: infrastructure/environments/prod
```

## セキュリティスキャン

### tfsec

```yaml
- name: Run tfsec
  uses: aquasecurity/tfsec-action@v1.0.0
  with:
    working_directory: infrastructure
    soft_fail: true  # PR段階では警告のみ
```

### checkov

```yaml
- name: Run Checkov
  uses: bridgecrewio/checkov-action@v12
  with:
    directory: infrastructure
    framework: terraform
    soft_fail: true
    output_format: sarif
```

### terraform-docs

```yaml
- name: Generate Docs
  uses: terraform-docs/gh-actions@v1.0.0
  with:
    working-dir: infrastructure/modules
    output-file: README.md
    output-method: inject
    git-push: true
```

## Atlantis設定

```yaml
# atlantis.yaml
version: 3
automerge: false
delete_source_branch_on_merge: true

projects:
  - name: networking-prod
    dir: infrastructure/environments/prod/networking
    workspace: default
    terraform_version: v1.6.0
    autoplan:
      when_modified:
        - "**/*.tf"
        - "../../../modules/networking/**/*.tf"
      enabled: true
    apply_requirements:
      - approved
      - mergeable

  - name: application-prod
    dir: infrastructure/environments/prod/application
    workspace: default
    terraform_version: v1.6.0
    apply_requirements:
      - approved
      - mergeable
```

## Terraform Cloud/Enterprise

```hcl
# backend.tf
terraform {
  cloud {
    organization = "mycompany"

    workspaces {
      name = "prod-networking"
    }
  }
}
```

## コスト見積もり

### Infracost

```yaml
- name: Setup Infracost
  uses: infracost/actions/setup@v2
  with:
    api-key: ${{ secrets.INFRACOST_API_KEY }}

- name: Generate Infracost diff
  run: |
    infracost diff \
      --path=infrastructure/environments/prod \
      --format=json \
      --out-file=/tmp/infracost.json

- name: Post Infracost comment
  uses: infracost/actions/comment@v1
  with:
    path: /tmp/infracost.json
    behavior: update
```

## ブランチ戦略

```
main (protected)
  │
  ├── feature/add-rds
  │     └── PR → plan自動実行
  │         └── approve → merge → apply自動実行
  │
  └── feature/update-vpc
        └── PR → plan自動実行
```

## 環境別パイプライン

```yaml
# matrix による環境別実行
jobs:
  plan:
    strategy:
      matrix:
        environment: [dev, staging, prod]
    
    steps:
      - name: Terraform Plan
        run: terraform plan
        working-directory: infrastructure/environments/${{ matrix.environment }}
```

## ベストプラクティス

1. **PRベースの変更** - 直接applyしない
2. **plan出力をPRにコメント** - レビュアーが確認可能
3. **セキュリティスキャン** - tfsec/checkovで脆弱性検出
4. **コスト見積もり** - Infracostで予算超過を防止
5. **承認ゲート** - production環境は手動承認
6. **ロールバック計画** - 失敗時の復旧手順を文書化
