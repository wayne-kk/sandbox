#!/bin/bash

# 网络诊断脚本
# 用于排查 Dify API 连接问题

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 开始网络诊断...${NC}"

# Dify API 地址
DIFY_HOST="152.136.41.186"
DIFY_PORT="32422"
DIFY_URL="http://${DIFY_HOST}:${DIFY_PORT}/v1/workflows/run"

echo -e "${YELLOW}📋 诊断目标:${NC}"
echo -e "${YELLOW}   主机: ${DIFY_HOST}${NC}"
echo -e "${YELLOW}   端口: ${DIFY_PORT}${NC}"
echo -e "${YELLOW}   完整URL: ${DIFY_URL}${NC}"
echo ""

# 1. 检查基本网络连接
echo -e "${BLUE}1. 检查基本网络连接...${NC}"
if ping -c 3 ${DIFY_HOST} > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Ping 成功${NC}"
else
    echo -e "${RED}   ❌ Ping 失败${NC}"
fi

# 2. 检查端口连通性
echo -e "${BLUE}2. 检查端口连通性...${NC}"
if timeout 10 bash -c "</dev/tcp/${DIFY_HOST}/${DIFY_PORT}" 2>/dev/null; then
    echo -e "${GREEN}   ✅ 端口 ${DIFY_PORT} 可访问${NC}"
else
    echo -e "${RED}   ❌ 端口 ${DIFY_PORT} 不可访问${NC}"
fi

# 3. 检查 DNS 解析
echo -e "${BLUE}3. 检查 DNS 解析...${NC}"
if nslookup ${DIFY_HOST} > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ DNS 解析成功${NC}"
    nslookup ${DIFY_HOST} | grep "Address:"
else
    echo -e "${RED}   ❌ DNS 解析失败${NC}"
fi

# 4. 检查路由
echo -e "${BLUE}4. 检查路由...${NC}"
if command -v traceroute > /dev/null; then
    echo -e "${YELLOW}   路由跟踪 (前5跳):${NC}"
    traceroute -m 5 ${DIFY_HOST} 2>/dev/null | head -10
else
    echo -e "${YELLOW}   traceroute 不可用，跳过路由检查${NC}"
fi

# 5. 检查防火墙
echo -e "${BLUE}5. 检查防火墙状态...${NC}"
if command -v ufw > /dev/null; then
    ufw_status=$(ufw status 2>/dev/null)
    if [[ $ufw_status == *"Status: active"* ]]; then
        echo -e "${YELLOW}   UFW 防火墙已启用${NC}"
        echo -e "${YELLOW}   当前规则:${NC}"
        ufw status numbered 2>/dev/null | head -10
    else
        echo -e "${GREEN}   UFW 防火墙未启用${NC}"
    fi
else
    echo -e "${YELLOW}   UFW 不可用，跳过防火墙检查${NC}"
fi

# 6. 测试 HTTP 连接
echo -e "${BLUE}6. 测试 HTTP 连接...${NC}"
echo -e "${YELLOW}   测试 GET 请求...${NC}"
if curl -s --connect-timeout 10 --max-time 30 -I ${DIFY_URL} > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ HTTP 连接成功${NC}"
    echo -e "${YELLOW}   响应头:${NC}"
    curl -s --connect-timeout 10 --max-time 30 -I ${DIFY_URL} 2>/dev/null | head -5
else
    echo -e "${RED}   ❌ HTTP 连接失败${NC}"
fi

# 7. 测试 POST 请求
echo -e "${BLUE}7. 测试 POST 请求...${NC}"
echo -e "${YELLOW}   发送测试 POST 请求...${NC}"
test_payload='{"inputs":{"query":"test","project_type":"nextjs","component_type":"component"},"response_mode":"blocking","conversation_id":"","user":"test"}'

if curl -s --connect-timeout 10 --max-time 30 \
    -X POST \
    -H "Content-Type: application/json" \
    -d "${test_payload}" \
    ${DIFY_URL} > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ POST 请求成功${NC}"
else
    echo -e "${RED}   ❌ POST 请求失败${NC}"
    echo -e "${YELLOW}   详细错误信息:${NC}"
    curl -s --connect-timeout 10 --max-time 30 \
        -X POST \
        -H "Content-Type: application/json" \
        -d "${test_payload}" \
        ${DIFY_URL} 2>&1 | head -3
fi

# 8. 检查系统网络配置
echo -e "${BLUE}8. 检查系统网络配置...${NC}"
echo -e "${YELLOW}   网络接口:${NC}"
ip addr show | grep -E "inet |UP" | head -6

echo -e "${YELLOW}   路由表:${NC}"
ip route | head -5

# 9. 检查代理设置
echo -e "${BLUE}9. 检查代理设置...${NC}"
if [[ -n "$http_proxy" || -n "$https_proxy" || -n "$HTTP_PROXY" || -n "$HTTPS_PROXY" ]]; then
    echo -e "${YELLOW}   检测到代理设置:${NC}"
    echo -e "${YELLOW}   http_proxy: ${http_proxy:-$HTTP_PROXY}${NC}"
    echo -e "${YELLOW}   https_proxy: ${https_proxy:-$HTTPS_PROXY}${NC}"
else
    echo -e "${GREEN}   未检测到代理设置${NC}"
fi

echo ""
echo -e "${BLUE}🔍 诊断完成${NC}"
echo -e "${YELLOW}💡 如果连接失败，请检查:${NC}"
echo -e "${YELLOW}   1. 网络连接是否正常${NC}"
echo -e "${YELLOW}   2. 防火墙是否阻止了端口 ${DIFY_PORT}${NC}"
echo -e "${YELLOW}   3. Dify 服务是否正在运行${NC}"
echo -e "${YELLOW}   4. 服务器是否在正确的网络环境中${NC}"
