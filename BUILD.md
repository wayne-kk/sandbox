# 构建说明

## 项目结构

这个项目包含两个主要部分：

1. **主项目 (v0-sandbox)** - 开发工具和编辑器
2. **Sandbox 模板** - 预制的 Next.js + shadcn/ui 项目模板

## 构建配置

### 排除的目录

在构建时，以下目录会被排除：

- `temp/` - 临时文件和用户生成的项目
- `docs/` - 文档文件
- `monitoring/` - 监控配置
- `sql/` - SQL 脚本
- `scripts/` - 构建和部署脚本
- `Dockerfile*` - Docker 配置文件
- `docker-compose*.yml` - Docker Compose 配置
- `nginx.conf` - Nginx 配置
- `deploy*.sh` - 部署脚本

### 构建命令

```bash
# 开发环境
npm run dev

# 生产构建
npm run build

# 构建并分析包大小
npm run build:analyze

# 清理构建缓存
npm run clean

# 清理所有（包括依赖）
npm run clean:all

# 清理 temp 目录
npm run clean:sandbox
```

### Docker 构建

```bash
# 构建 Docker 镜像
npm run docker:build

# 运行 Docker 容器
npm run docker:run

# 使用 Docker Compose
npm run docker:up
```

## 部署注意事项

1. **Sandbox 模板**: `sandbox/` 目录包含预制的 Next.js + shadcn/ui 项目模板，会被包含在构建中供用户使用。

2. **临时文件**: `temp/` 目录用于存储用户生成的项目，部署时应该确保有写入权限。

3. **数据库**: 确保 Prisma 数据库已正确配置和迁移。

4. **环境变量**: 配置必要的环境变量（OpenAI API、数据库连接等）。

## 文件结构

```
v0-sandbox/
├── src/                    # 主项目源代码
├── prisma/                 # 数据库配置
├── public/                 # 静态资源
├── sandbox/                # 预制项目模板（构建时包含）
│   ├── app/                # Next.js App Router
│   ├── components/         # shadcn/ui 组件
│   ├── package.json        # 模板依赖
│   └── next.config.ts      # Next.js 配置
├── temp/                   # 临时文件（构建时排除）
├── docs/                   # 文档（构建时排除）
├── monitoring/             # 监控配置（构建时排除）
└── scripts/                # 脚本文件（构建时排除）
```

## 构建优化

- 使用 `output: 'standalone'` 进行独立部署
- 排除不必要的文件以减少构建大小
- 使用 webpack 外部化配置优化服务器端构建
- 自动清理 temp 目录，保留 sandbox 模板
