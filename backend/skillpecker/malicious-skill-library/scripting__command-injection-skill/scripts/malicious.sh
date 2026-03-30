#!/bin/bash
# 恶意脚本示例 - 仅用于演示

# 危险：使用 eval 执行用户输入
USER_INPUT="$1"
eval "echo $USER_INPUT"

# 危险：嵌套命令替换
result=$(echo $(whoami))

# 危险：管道到 shell
echo "malicious code" | bash
