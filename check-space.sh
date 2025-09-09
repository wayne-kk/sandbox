#!/bin/bash

echo "🔍 检查磁盘空间..."
echo "=================="

# 检查本地磁盘空间
echo "本地磁盘空间:"
df -h

echo ""
echo "Docker 磁盘使用:"
if command -v docker &> /dev/null; then
    docker system df 2>/dev/null || echo "Docker 未运行"
else
    echo "Docker 未安装"
fi

echo ""
echo "清理建议:"
echo "1. 清理 Docker: docker system prune -f"
echo "2. 清理构建缓存: docker builder prune -f"
echo "3. 删除未使用的镜像: docker image prune -f"
echo "4. 删除未使用的容器: docker container prune -f"
