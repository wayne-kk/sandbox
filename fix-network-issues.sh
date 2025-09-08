#!/bin/bash

# 网络问题修复脚本
# 用于修复常见的 Dify API 连接问题

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 开始修复网络问题...${NC}"

# 检查是否以 root 权限运行
if [[ $EUID -eq 0 ]]; then
    echo -e "${YELLOW}⚠️  检测到 root 权限，继续执行...${NC}"
else
    echo -e "${YELLOW}💡 某些操作可能需要 sudo 权限${NC}"
fi

# 1. 检查并修复防火墙设置
echo -e "${BLUE}1. 检查防火墙设置...${NC}"
if command -v ufw > /dev/null; then
    ufw_status=$(ufw status 2>/dev/null)
    if [[ $ufw_status == *"Status: active"* ]]; then
        echo -e "${YELLOW}   UFW 防火墙已启用，检查规则...${NC}"
        
        # 检查是否允许出站连接
        if ! ufw status | grep -q "Anywhere.*OUT"; then
            echo -e "${YELLOW}   添加出站连接规则...${NC}"
            sudo ufw allow out 32422/tcp 2>/dev/null || echo -e "${RED}   添加规则失败${NC}"
        fi
        
        # 检查是否允许特定 IP 的出站连接
        if ! ufw status | grep -q "152.136.41.186"; then
            echo -e "${YELLOW}   添加特定 IP 出站规则...${NC}"
            sudo ufw allow out to 152.136.41.186 port 32422 2>/dev/null || echo -e "${RED}   添加规则失败${NC}"
        fi
        
        echo -e "${GREEN}   ✅ 防火墙规则检查完成${NC}"
    else
        echo -e "${GREEN}   UFW 防火墙未启用${NC}"
    fi
else
    echo -e "${YELLOW}   UFW 不可用，跳过防火墙检查${NC}"
fi

# 2. 检查 DNS 设置
echo -e "${BLUE}2. 检查 DNS 设置...${NC}"
if command -v systemd-resolve > /dev/null; then
    echo -e "${YELLOW}   当前 DNS 设置:${NC}"
    systemd-resolve --status | grep "DNS Servers" | head -3
elif command -v resolvectl > /dev/null; then
    echo -e "${YELLOW}   当前 DNS 设置:${NC}"
    resolvectl status | grep "DNS Servers" | head -3
else
    echo -e "${YELLOW}   无法检查 DNS 设置${NC}"
fi

# 3. 刷新 DNS 缓存
echo -e "${BLUE}3. 刷新 DNS 缓存...${NC}"
if command -v systemd-resolve > /dev/null; then
    sudo systemd-resolve --flush-caches 2>/dev/null && echo -e "${GREEN}   ✅ DNS 缓存已刷新${NC}" || echo -e "${RED}   ❌ DNS 缓存刷新失败${NC}"
elif command -v resolvectl > /dev/null; then
    sudo resolvectl flush-caches 2>/dev/null && echo -e "${GREEN}   ✅ DNS 缓存已刷新${NC}" || echo -e "${RED}   ❌ DNS 缓存刷新失败${NC}"
else
    echo -e "${YELLOW}   无法刷新 DNS 缓存${NC}"
fi

# 4. 检查网络接口
echo -e "${BLUE}4. 检查网络接口...${NC}"
echo -e "${YELLOW}   网络接口状态:${NC}"
ip addr show | grep -E "inet |UP" | head -6

# 5. 测试基本连接
echo -e "${BLUE}5. 测试基本连接...${NC}"
if ping -c 3 152.136.41.186 > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Ping 成功${NC}"
else
    echo -e "${RED}   ❌ Ping 失败${NC}"
    echo -e "${YELLOW}   尝试使用不同的网络接口...${NC}"
    
    # 尝试使用不同的网络接口
    for interface in $(ip route | grep default | awk '{print $5}' | sort -u); do
        echo -e "${YELLOW}   测试接口: ${interface}${NC}"
        if ping -I ${interface} -c 2 152.136.41.186 > /dev/null 2>&1; then
            echo -e "${GREEN}   ✅ 接口 ${interface} 连接成功${NC}"
            break
        else
            echo -e "${RED}   ❌ 接口 ${interface} 连接失败${NC}"
        fi
    done
fi

# 6. 检查代理设置
echo -e "${BLUE}6. 检查代理设置...${NC}"
if [[ -n "$http_proxy" || -n "$https_proxy" || -n "$HTTP_PROXY" || -n "$HTTPS_PROXY" ]]; then
    echo -e "${YELLOW}   检测到代理设置:${NC}"
    echo -e "${YELLOW}   http_proxy: ${http_proxy:-$HTTP_PROXY}${NC}"
    echo -e "${YELLOW}   https_proxy: ${https_proxy:-$HTTPS_PROXY}${NC}"
    echo -e "${YELLOW}   💡 如果代理设置不正确，请检查环境变量${NC}"
else
    echo -e "${GREEN}   未检测到代理设置${NC}"
fi

# 7. 重启网络服务（谨慎操作）
echo -e "${BLUE}7. 网络服务状态检查...${NC}"
if command -v systemctl > /dev/null; then
    echo -e "${YELLOW}   网络服务状态:${NC}"
    systemctl status networking 2>/dev/null | head -3 || echo -e "${YELLOW}   networking 服务不可用${NC}"
    systemctl status NetworkManager 2>/dev/null | head -3 || echo -e "${YELLOW}   NetworkManager 服务不可用${NC}"
else
    echo -e "${YELLOW}   systemctl 不可用，跳过服务检查${NC}"
fi

# 8. 提供手动修复建议
echo ""
echo -e "${BLUE}🔧 手动修复建议:${NC}"
echo -e "${YELLOW}   如果问题仍然存在，请尝试以下操作:${NC}"
echo ""
echo -e "${YELLOW}   1. 检查防火墙规则:${NC}"
echo -e "${YELLOW}      sudo ufw status numbered${NC}"
echo -e "${YELLOW}      sudo ufw allow out 32422/tcp${NC}"
echo ""
echo -e "${YELLOW}   2. 检查路由表:${NC}"
echo -e "${YELLOW}      ip route show${NC}"
echo ""
echo -e "${YELLOW}   3. 重启网络服务:${NC}"
echo -e "${YELLOW}      sudo systemctl restart networking${NC}"
echo -e "${YELLOW}      sudo systemctl restart NetworkManager${NC}"
echo ""
echo -e "${YELLOW}   4. 检查 Docker 网络:${NC}"
echo -e "${YELLOW}      docker network ls${NC}"
echo -e "${YELLOW}      docker network inspect bridge${NC}"
echo ""
echo -e "${YELLOW}   5. 测试容器内网络:${NC}"
echo -e "${YELLOW}      docker exec -it v0-sandbox-app curl -I http://152.136.41.186:32422${NC}"
echo ""
echo -e "${YELLOW}   6. 检查 Dify 服务状态:${NC}"
echo -e "${YELLOW}      curl -I http://152.136.41.186:32422/v1/workflows/run${NC}"

echo ""
echo -e "${GREEN}✅ 网络问题修复脚本执行完成${NC}"
echo -e "${YELLOW}💡 如果问题仍然存在，请运行 ./diagnose-network.sh 获取详细诊断信息${NC}"
