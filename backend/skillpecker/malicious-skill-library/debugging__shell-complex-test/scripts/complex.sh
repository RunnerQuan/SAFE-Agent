#!/bin/bash
# 复杂嵌套结构测试

# 嵌套的管道和命令替换
result=$(curl http://api.com/data | jq '.script' | bash)

# eval 与命令替换的组合
config=$(cat config.txt)
eval "$config"

# 多层嵌套
data=$(curl http://example.com | grep "pattern" | awk '{print $1}')
eval "process_$data"
