#!/bin/bash

echo "🔧 配置 Docker 镜像加速器..."

# 检查操作系统
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "📱 检测到 macOS 系统"
    echo "请在 Docker Desktop 中手动配置镜像加速器："
    echo "1. 打开 Docker Desktop"
    echo "2. 进入 Settings > Docker Engine"
    echo "3. 添加以下配置："
    echo ""
    echo '{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}'
    echo ""
    echo "4. 点击 Apply & Restart"
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "🐧 检测到 Linux 系统"
    
    # 创建 Docker 配置目录
    sudo mkdir -p /etc/docker
    
    # 备份现有配置
    if [ -f /etc/docker/daemon.json ]; then
        sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.backup
        echo "✅ 已备份现有 Docker 配置"
    fi
    
    # 写入新的镜像加速器配置
    sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
EOF
    
    echo "✅ Docker 镜像加速器配置完成"
    
    # 重启 Docker 服务
    echo "🔄 重启 Docker 服务..."
    sudo systemctl daemon-reload
    sudo systemctl restart docker
    
    # 等待 Docker 启动
    sleep 5
    
    # 验证配置
    echo "🔍 验证 Docker 配置..."
    docker info | grep -A 5 "Registry Mirrors"
    
else
    echo "❓ 未识别的操作系统类型: $OSTYPE"
    echo "请手动配置 Docker 镜像加速器"
fi

echo "🎉 配置完成！现在可以运行 ./deploy.sh 进行部署"
