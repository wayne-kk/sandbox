#!/bin/bash

echo "🔧 修复 Docker 镜像拉取超时问题..."

# 1. 配置 Docker 镜像加速器
echo "📡 配置 Docker 镜像加速器..."

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
    "https://mirror.baidubce.com",
    "https://ccr.ccs.tencentyun.com"
  ],
  "insecure-registries": [],
  "debug": false,
  "experimental": false,
  "features": {
    "buildkit": true
  },
  "max-concurrent-downloads": 3,
  "max-concurrent-uploads": 5,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

echo "✅ Docker 镜像加速器配置完成"

# 2. 重启 Docker 服务
echo "🔄 重启 Docker 服务..."
sudo systemctl daemon-reload
sudo systemctl restart docker

# 等待 Docker 启动
sleep 5

# 3. 验证配置
echo "🔍 验证 Docker 配置..."
docker info | grep -A 10 "Registry Mirrors"

# 4. 测试镜像拉取
echo "🧪 测试镜像拉取..."
docker pull hello-world

if [ $? -eq 0 ]; then
    echo "✅ Docker 镜像拉取测试成功！"
    docker rmi hello-world 2>/dev/null
else
    echo "❌ Docker 镜像拉取测试失败"
fi

echo "🎉 Docker 超时问题修复完成！"
