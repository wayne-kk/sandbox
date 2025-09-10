#!/bin/bash

echo "🧹 清理端口占用"
echo "==============="

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 要清理的端口列表
PORTS=(3100 3101 3102 3103 3104 3105 3000)

for port in "${PORTS[@]}"; do
    echo -e "${YELLOW}🔍 检查端口 $port...${NC}"
    
    # 查找占用端口的进程
    PIDS=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$PIDS" ]; then
        echo -e "${RED}⚠️  端口 $port 被以下进程占用: $PIDS${NC}"
        
        # 逐个kill进程
        for pid in $PIDS; do
            echo -e "${YELLOW}🔪 正在kill进程 $pid...${NC}"
            if kill -9 $pid 2>/dev/null; then
                echo -e "${GREEN}✅ 已kill进程 $pid${NC}"
            else
                echo -e "${RED}❌ kill进程 $pid 失败${NC}"
            fi
        done
        
        # 等待端口释放
        sleep 2
        
        # 再次检查
        REMAINING_PIDS=$(lsof -ti:$port 2>/dev/null)
        if [ -n "$REMAINING_PIDS" ]; then
            echo -e "${RED}❌ 端口 $port 仍有进程占用: $REMAINING_PIDS${NC}"
        else
            echo -e "${GREEN}✅ 端口 $port 已释放${NC}"
        fi
    else
        echo -e "${GREEN}✅ 端口 $port 可用${NC}"
    fi
done

echo ""
echo -e "${GREEN}🎉 端口清理完成！${NC}"
echo -e "${YELLOW}💡 现在可以安全启动服务了${NC}"
