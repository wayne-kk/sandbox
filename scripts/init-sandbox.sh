#!/bin/bash

# Sandbox 初始化脚本
# 确保 sandbox 目录存在并设置正确的权限

set -e

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SANDBOX_DIR="$PROJECT_ROOT/sandbox"

log_info "初始化 sandbox 目录..."

# 创建 sandbox 目录
mkdir -p "$SANDBOX_DIR"

# 设置权限
chmod 755 "$SANDBOX_DIR"

# 如果存在 v0sandbox 用户，设置所有者
if id "v0sandbox" &>/dev/null; then
    chown v0sandbox:v0sandbox "$SANDBOX_DIR"
    log_info "设置 sandbox 目录所有者为 v0sandbox"
fi

# 创建基础目录结构
mkdir -p "$SANDBOX_DIR/app"
mkdir -p "$SANDBOX_DIR/components"
mkdir -p "$SANDBOX_DIR/lib"
mkdir -p "$SANDBOX_DIR/public"

log_success "sandbox 目录初始化完成: $SANDBOX_DIR"

# 显示目录结构
log_info "sandbox 目录结构:"
ls -la "$SANDBOX_DIR"
