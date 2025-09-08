#!/bin/bash

# 动态生成Nginx配置脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 动态生成Nginx配置...${NC}"

# 检测正在运行的Sandbox端口
echo -e "${YELLOW}🔍 检测正在运行的Sandbox端口 (3100-3199)...${NC}"
running_ports=()

for port in {3100..3199}; do
    if netstat -tlnp 2>/dev/null | grep -q ":$port " || ss -tlnp 2>/dev/null | grep -q ":$port "; then
        running_ports+=($port)
        echo -e "${GREEN}   ✅ 端口 $port 正在运行${NC}"
    fi
done

if [ ${#running_ports[@]} -eq 0 ]; then
    echo -e "${YELLOW}⚠️  没有检测到运行中的Sandbox端口，将使用默认端口3100${NC}"
    running_ports=(3100)
fi

echo -e "${GREEN}📋 检测到 ${#running_ports[@]} 个运行中的端口: ${running_ports[*]}${NC}"

# 生成upstream配置
echo -e "${YELLOW}📝 生成upstream配置...${NC}"
upstream_config="upstream sandbox_backend {"
for port in "${running_ports[@]}"; do
    upstream_config+="\n    server 127.0.0.1:$port;"
done
upstream_config+="\n}"

# 生成完整的Nginx配置
nginx_config="# 外部Nginx配置 - 支持Sandbox项目 (动态检测端口)
$upstream_config

server {
    listen 80;
    server_name 115.190.100.24;  # 或者填写您的域名
    
    # 主应用路由
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Sandbox项目路由 - 支持动态端口
    location /sandbox/ {
        # 使用upstream负载均衡，自动选择可用的端口
        proxy_pass http://sandbox_backend/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_cache_bypass \$http_upgrade;
        
        # 重要：iframe相关配置
        proxy_hide_header X-Frame-Options;
        proxy_hide_header Content-Security-Policy;
        add_header X-Frame-Options SAMEORIGIN always;
        
        # 移除路径前缀
        rewrite ^/sandbox/(.*)\$ /\$1 break;
    }
}

server {
    listen 443 ssl;
    server_name wayne.beer;

    ssl_certificate /etc/letsencrypt/live/wayne.beer/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wayne.beer/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 主应用路由
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Sandbox项目路由 - 支持动态端口
    location /sandbox/ {
        # 使用upstream负载均衡，自动选择可用的端口
        proxy_pass http://sandbox_backend/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_cache_bypass \$http_upgrade;
        
        # 重要：iframe相关配置
        proxy_hide_header X-Frame-Options;
        proxy_hide_header Content-Security-Policy;
        add_header X-Frame-Options SAMEORIGIN always;
        
        # 移除路径前缀
        rewrite ^/sandbox/(.*)\$ /\$1 break;
    }
}"

# 保存配置到文件
echo -e "$nginx_config" > nginx-external-config.conf

echo -e "${GREEN}✅ Nginx配置已生成: nginx-external-config.conf${NC}"
echo -e "${YELLOW}📋 配置的端口: ${running_ports[*]}${NC}"
echo ""
echo -e "${BLUE}🚀 下一步:${NC}"
echo -e "${YELLOW}   sudo ./update-external-nginx.sh${NC}"
