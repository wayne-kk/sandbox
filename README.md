# V0 Sandbox - AI 驱动的在线代码编辑器

一个集成了 AI 代码生成、实时预览和项目管理的现代化在线开发环境。支持通过自然语言描述生成 React/Next.js 组件，并提供完整的开发、预览和部署体验。

## ✨ 核心功能

### 🤖 AI 代码生成
- **智能组件生成**: 通过自然语言描述生成 React/Next.js 组件
- **Dify 集成**: 基于先进的 AI 模型进行代码生成
- **特性选择**: 支持响应式设计、TypeScript、Tailwind CSS 等特性
- **实时预览**: 生成后立即预览组件效果

### 🎨 现代化编辑器
- **Monaco 编辑器**: 基于 VS Code 的强大代码编辑体验
- **语法高亮**: 支持 TypeScript、JavaScript、CSS 等
- **智能提示**: 完整的代码补全和错误检查
- **多文件管理**: 支持项目结构管理和文件导航

### 🐳 容器化沙箱
- **Docker 隔离**: 安全隔离的项目运行环境
- **实时预览**: 即时查看项目运行结果
- **多设备预览**: 支持桌面端、平板端、移动端预览
- **热重载**: 代码修改后自动刷新预览

### 📊 项目管理
- **项目模板**: 内置多种项目模板
- **版本控制**: 支持文件版本管理和回滚
- **依赖管理**: 自动处理项目依赖
- **GitHub 集成**: 支持从 GitHub 导入项目

## 🛠 技术栈

### 前端技术
- **框架**: Next.js 15, React 18
- **语言**: TypeScript
- **样式**: Tailwind CSS 4.0
- **UI 组件**: Radix UI + 自定义组件
- **编辑器**: Monaco Editor
- **图标**: Lucide React

### 后端技术
- **API**: Next.js API Routes
- **数据库**: Prisma + SQLite/PostgreSQL
- **向量数据库**: Supabase Vector
- **AI 服务**: Dify + OpenAI
- **容器化**: Docker + Docker Compose

### 开发工具
- **代码质量**: ESLint + Prettier
- **类型检查**: TypeScript
- **构建工具**: Next.js Build System
- **包管理**: npm

## 🚀 快速开始

### 环境要求

- Node.js 18+ 
- Docker & Docker Compose
- npm 或 yarn

### 本地开发

1. **克隆项目**
```bash
git clone <repository-url>
cd v0-sandbox
```

2. **安装依赖**
```bash
npm install
```

3. **环境配置**
```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑环境变量
nano .env.local
```

4. **启动开发服务器**
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### Docker 开发环境

```bash
# 构建并启动所有服务
docker-compose up --build

# 后台运行
docker-compose up -d --build
```

## 📋 环境配置

### 必需的环境变量

```bash
# .env.local

# Dify AI 服务配置
DIFY_API_KEY=your_dify_api_key
DIFY_API_ENDPOINT=https://api.dify.ai/v1

# 数据库配置
DATABASE_URL="file:./dev.db"

# Supabase 配置（可选，用于向量数据库）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI 配置（可选，用于 AI 功能）
OPENAI_API_KEY=your_openai_api_key

# 应用配置
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 数据库初始化

```bash
# 生成 Prisma 客户端
npm run db:generate

# 推送数据库模式
npm run db:push

# 运行数据库种子
npm run db:seed
```

## 🌐 火山引擎部署指南

### 快速部署

#### 使用部署脚本（推荐）

```bash
# 一键部署到火山引擎服务器
./deploy.sh production

# 部署到测试环境
./deploy.sh staging

# 查看帮助
./deploy.sh --help
```

#### 手动部署步骤

1. **准备火山引擎服务器**
```bash
# 创建 ECS 实例
# 规格：2核4GB 或更高
# 系统：Ubuntu 20.04 LTS
# 存储：40GB SSD
# 网络：公网IP，开放端口 22, 80, 443, 3000, 3100-3200
```

2. **连接服务器并部署**
```bash
# 连接服务器
ssh root@your-server-ip

# 克隆项目
git clone <your-repository-url>
cd v0-sandbox

# 配置环境变量
cp .env.example .env.local
nano .env.local  # 编辑环境变量

# 一键部署
sudo ./deploy.sh production
```

3. **访问应用**
```bash
# 应用地址
http://your-server-ip

# 健康检查
http://your-server-ip/api/health

# 监控面板
http://your-server-ip:3001  # Grafana (admin/admin123)
http://your-server-ip:9090  # Prometheus
```

### 部署脚本功能

`deploy.sh` 脚本会自动完成：

1. **系统环境检查** - 检查操作系统、内存、磁盘
2. **依赖安装** - Node.js 18+, Docker, Docker Compose, Nginx, PM2
3. **防火墙配置** - 开放必要端口
4. **应用部署** - 克隆代码、安装依赖、构建应用
5. **数据库初始化** - Prisma 迁移和种子数据
6. **Nginx 配置** - 反向代理和负载均衡
7. **服务启动** - Docker Compose 启动所有服务
8. **健康检查** - 验证部署是否成功

### 监控和运维

部署完成后，您将获得：

- **应用监控** - Prometheus + Grafana
- **日志收集** - Loki + Promtail
- **健康检查** - 自动监控应用状态
- **自动重启** - 服务异常时自动恢复
- **日志管理** - 集中化日志收集和分析

### 成本估算

**火山引擎 ECS 实例推荐配置：**

| 环境 | 规格 | 月费用 | 适用场景 |
|------|------|--------|----------|
| 开发 | 1核2GB | ~50元 | 个人开发测试 |
| 测试 | 2核4GB | ~100元 | 团队测试环境 |
| 生产 | 4核8GB | ~200元 | 正式生产环境 |

### 安全配置

- **防火墙** - 只开放必要端口
- **SSL 证书** - 支持 Let's Encrypt 自动申请
- **安全头** - Nginx 安全头配置
- **用户隔离** - 专用应用用户运行
- **权限控制** - 最小权限原则

## 📁 项目结构

```
v0-sandbox/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── ai/            # AI 相关 API
│   │   │   ├── sandbox/       # 沙箱管理 API
│   │   │   ├── preview/       # 预览 API
│   │   │   └── vector/        # 向量数据库 API
│   │   ├── ai-generator/      # AI 生成器页面
│   │   ├── editor/            # 代码编辑器页面
│   │   ├── dashboard/         # 仪表板页面
│   │   └── preview/           # 预览页面
│   ├── components/            # React 组件
│   │   ├── AI/               # AI 相关组件
│   │   ├── Editor/           # 编辑器组件
│   │   ├── Preview/          # 预览组件
│   │   └── ui/               # UI 基础组件
│   ├── lib/                  # 工具库
│   │   ├── ai/               # AI 服务
│   │   ├── docker/           # Docker 管理
│   │   ├── vector/           # 向量数据库
│   │   └── utils.ts          # 工具函数
│   └── types/                # TypeScript 类型定义
├── sandbox/                  # 沙箱项目文件
├── prisma/                   # 数据库模式
├── docs/                     # 文档
├── docker-compose.yml        # Docker 开发配置
├── Dockerfile               # Docker 镜像
└── package.json             # 项目配置
```

## 🔧 开发指南

### 添加新功能

1. **创建 API 路由**
```typescript
// src/app/api/your-feature/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    // 处理逻辑
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: '处理失败' }, { status: 500 });
  }
}
```

2. **创建 React 组件**
```typescript
// src/components/YourFeature/YourComponent.tsx
'use client';

import React from 'react';

interface YourComponentProps {
  // 属性定义
}

export default function YourComponent({ }: YourComponentProps) {
  return (
    <div>
      {/* 组件内容 */}
    </div>
  );
}
```

### 数据库操作

```bash
# 创建新的迁移
npm run db:migrate

# 重置数据库
npm run db:migrate:reset

# 查看数据库
npm run db:studio
```

### 代码质量

```bash
# 代码检查
npm run lint

# 类型检查
npx tsc --noEmit

# 格式化代码
npx prettier --write .
```

## 🧪 测试

```bash
# 运行测试
npm test

# 测试覆盖率
npm run test:coverage

# E2E 测试
npm run test:e2e
```

## 📚 API 文档

### AI 生成 API

```typescript
POST /api/ai/generate
{
  "prompt": "创建一个用户登录表单",
  "projectType": "nextjs",
  "features": ["响应式设计", "表单验证"]
}
```

### 沙箱管理 API

```typescript
POST /api/sandbox/start
// 启动沙箱环境

POST /api/sandbox/stop
// 停止沙箱环境

GET /api/sandbox/status
// 获取沙箱状态
```

### 文件管理 API

```typescript
POST /api/files/save
{
  "path": "components/Button.tsx",
  "content": "export default function Button() { ... }"
}
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

如果您遇到问题或有建议，请：

1. 查看 [Issues](https://github.com/your-repo/issues) 页面
2. 创建新的 Issue
3. 联系维护者

## 🔮 路线图

- [ ] 支持更多 AI 模型（Claude、Gemini 等）
- [ ] 添加协作编辑功能
- [ ] 集成更多项目模板
- [ ] 支持移动端应用开发
- [ ] 添加插件系统
- [ ] 实现项目分享功能
- [ ] 添加代码质量检查
- [ ] 支持多语言开发

---

**V0 Sandbox** - 让 AI 驱动的开发变得简单而强大 🚀