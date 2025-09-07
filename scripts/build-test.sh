#!/bin/bash

# 构建测试脚本
echo "🚀 开始构建测试..."

# 清理之前的构建
echo "🧹 清理之前的构建..."
npm run clean

# 清理 temp 目录
echo "🧹 清理 temp 目录..."
npm run clean:sandbox

# 检查 TypeScript 类型
echo "🔍 检查 TypeScript 类型..."
npm run type-check

# 运行 ESLint
echo "🔍 运行 ESLint..."
npm run lint

# 构建项目
echo "🏗️ 构建项目..."
npm run build

# 检查构建结果
if [ -d ".next" ]; then
    echo "✅ 构建成功！"
    echo "📁 构建输出目录: .next"
    
    # 检查构建大小
    echo "📊 构建大小分析:"
    du -sh .next
    
    # 检查 sandbox 模板是否包含在构建中
    if [ -d ".next/sandbox" ]; then
        echo "✅ sandbox 模板已包含在构建中"
    else
        echo "⚠️  sandbox 模板未包含在构建中（可能被排除）"
    fi
    
    # 检查是否排除了 temp 目录
    if [ ! -d ".next/temp" ]; then
        echo "✅ temp 目录已正确排除"
    else
        echo "❌ temp 目录未被排除"
    fi
    
    # 检查是否排除了 docs 目录
    if [ ! -d ".next/docs" ]; then
        echo "✅ docs 目录已正确排除"
    else
        echo "❌ docs 目录未被排除"
    fi
    
else
    echo "❌ 构建失败！"
    exit 1
fi

echo "🎉 构建测试完成！"
