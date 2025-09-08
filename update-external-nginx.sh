#!/bin/bash

# 更新外部Nginx配置脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 更新外部Nginx配置...${NC}"

# 检查是否以root权限运行
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请使用sudo运行此脚本${NC}"
    echo -e "${YELLOW}💡 使用方法: sudo ./update-external-nginx.sh${NC}"
    exit 1
fi

# 备份原配置
echo -e "${YELLOW}📋 备份原Nginx配置...${NC}"
if [ -f /etc/nginx/conf.d/wayne.beer.conf ]; then
    cp /etc/nginx/conf.d/wayne.beer.conf /etc/nginx/conf.d/wayne.beer.conf.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✅ 原配置已备份${NC}"
else
    echo -e "${YELLOW}⚠️  未找到原配置文件${NC}"
fi

# 复制新配置
echo -e "${YELLOW}📝 应用新Nginx配置...${NC}"
cp nginx-external-config.conf /etc/nginx/conf.d/wayne.beer.conf

# 测试Nginx配置
echo -e "${YELLOW}🧪 测试Nginx配置...${NC}"
if nginx -t; then
    echo -e "${GREEN}✅ Nginx配置测试通过${NC}"
else
    echo -e "${RED}❌ Nginx配置测试失败${NC}"
    echo -e "${YELLOW}💡 请检查配置文件语法${NC}"
    exit 1
fi

# 重新加载Nginx
echo -e "${YELLOW}🔄 重新加载Nginx...${NC}"
systemctl reload nginx

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx重新加载成功${NC}"
else
    echo -e "${RED}❌ Nginx重新加载失败${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 外部Nginx配置更新完成！${NC}"
echo ""
echo -e "${BLUE}📋 配置说明:${NC}"
echo -e "${YELLOW}   - 主应用: https://wayne.beer/ 或 http://115.190.100.24/${NC}"
echo -e "${YELLOW}   - Sandbox项目: https://wayne.beer/sandbox/ 或 http://115.190.100.24/sandbox/${NC}"
echo -e "${YELLOW}   - 代理到: http://127.0.0.1:3100/ (Docker容器)${NC}"
echo ""
echo -e "${BLUE}🔍 测试命令:${NC}"
echo -e "${YELLOW}   curl -I https://wayne.beer/sandbox/${NC}"
echo -e "${YELLOW}   curl -I http://115.190.100.24/sandbox/${NC}"
