# 🗄️ Prisma ORM 集成指南

本项目使用 **Prisma** 作为 ORM 工具，连接 **Supabase PostgreSQL** 数据库，提供类型安全的数据库操作。

## 🚀 快速开始

### 1. 环境配置

```bash
# 复制环境变量文件
cp .env.example .env

# 编辑 .env 文件，配置 Supabase 数据库连接
```

**关键环境变量：**
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

### 2. 自动设置

```bash
# 运行自动设置脚本
chmod +x scripts/setup-prisma.sh
./scripts/setup-prisma.sh
```

### 3. 手动设置

```bash
# 安装依赖
npm install

# 生成 Prisma 客户端
npm run db:generate

# 推送数据库结构到 Supabase
npm run db:push

# 填充初始数据
npm run db:seed
```

## 📋 数据库架构

### 核心表结构

```
📊 users              - 用户管理
├── 📁 projects       - 用户项目
├── 📄 project_files  - 项目文件
├── 📸 project_versions - 版本快照
├── 👥 project_collaborators - 协作者
├── 📝 project_activities - 活动日志
└── 🎨 templates      - 项目模板
    └── 📄 template_files - 模板文件
```

### 关键特性

- ✅ **类型安全** - 自动生成 TypeScript 类型
- 🔄 **事务处理** - 保证数据一致性  
- 🔍 **关系查询** - 支持复杂关联查询
- 📊 **统计查询** - 内置计数和聚合
- 🔐 **权限控制** - Row Level Security (RLS)

## 🛠️ 常用命令

### 数据库操作

```bash
# 打开 Prisma Studio (可视化数据管理)
npm run db:studio

# 重新填充示例数据
npm run db:seed

# 推送结构变更
npm run db:push

# 创建迁移文件
npm run db:migrate

# 生成客户端代码
npm run db:generate
```

### 开发调试

```bash
# 启动开发服务器
npm run dev

# 查看数据库日志
# Prisma 会在开发模式下打印 SQL 查询
```

## 💻 代码使用示例

### 基础查询

```typescript
import { prisma } from '@/lib/prisma/client';

// 获取用户项目
const projects = await prisma.project.findMany({
  where: { userId: 'user_id' },
  include: {
    files: true,
    user: true,
    _count: { select: { files: true } }
  }
});

// 创建新项目
const project = await prisma.project.create({
  data: {
    name: '我的项目',
    userId: 'user_id',
    framework: 'react',
    language: 'typescript'
  }
});
```

### 复杂查询

```typescript
// 获取用户统计信息
const userStats = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    _count: {
      select: {
        projects: true,
        templates: true,
        collaborations: true
      }
    }
  }
});

// 分页查询项目
const result = await prisma.project.findMany({
  where: {
    OR: [
      { userId },
      { 
        collaborators: {
          some: { userId, isActive: true }
        }
      }
    ]
  },
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { lastAccessedAt: 'desc' }
});
```

### 事务操作

```typescript
// 文件保存事务
await prisma.$transaction(async (tx) => {
  // 保存文件
  await tx.projectFile.upsert({
    where: { projectId_filePath: { projectId, filePath } },
    update: { content, updatedAt: new Date() },
    create: { projectId, filePath, content, fileType }
  });

  // 更新项目时间
  await tx.project.update({
    where: { id: projectId },
    data: { lastAccessedAt: new Date() }
  });

  // 记录活动日志
  await tx.projectActivity.create({
    data: {
      projectId,
      userId,
      activityType: 'FILE_UPDATED',
      description: `文件 ${filePath} 已更新`
    }
  });
});
```

## 🎯 服务层架构

### 文件存储服务

```typescript
import { PrismaFileStorageService } from '@/lib/services/file-storage.service';

const fileStorage = PrismaFileStorageService.getInstance();

// 创建项目
const projectId = await fileStorage.createProjectFromTemplate(
  userId, 
  templateId, 
  projectName
);

// 保存文件
await fileStorage.saveFile(userId, projectId, filePath, content);

// 获取文件
const files = await fileStorage.getProjectFiles(userId, projectId);
```

### API 路由集成

```typescript
// src/app/api/projects/route.ts
import { PrismaFileStorageService } from '@/lib/services/file-storage.service';

export async function GET(request: NextRequest) {
  const fileStorage = PrismaFileStorageService.getInstance();
  const projects = await fileStorage.getUserProjects(userId);
  return NextResponse.json({ success: true, data: projects });
}
```

## 🔧 开发工具

### Prisma Studio

```bash
npm run db:studio
```

访问 `http://localhost:5555` 查看和编辑数据

### VS Code 扩展

推荐安装：
- **Prisma** - 语法高亮和智能提示
- **Database Client** - 数据库连接和查询

### 类型生成

每次修改 `schema.prisma` 后：

```bash
npm run db:generate  # 重新生成类型
```

## 📊 性能优化

### 查询优化

```typescript
// ✅ 好的实践 - 只选择需要的字段
const projects = await prisma.project.findMany({
  select: {
    id: true,
    name: true,
    user: { select: { username: true } }
  }
});

// ❌ 避免 - 查询所有字段
const projects = await prisma.project.findMany({
  include: { user: true }
});
```

### 批量操作

```typescript
// 批量创建
await prisma.projectFile.createMany({
  data: files.map(file => ({
    projectId,
    filePath: file.path,
    content: file.content
  }))
});

// 批量更新
await prisma.$transaction(
  files.map(file => 
    prisma.projectFile.upsert({
      where: { projectId_filePath: { projectId, filePath: file.path } },
      update: { content: file.content },
      create: { projectId, filePath: file.path, content: file.content }
    })
  )
);
```

## 🚨 常见问题

### 1. 连接错误

```bash
Error: Can't reach database server
```

**解决方案：**
- 检查 `DATABASE_URL` 是否正确
- 确认 Supabase 项目状态
- 验证网络连接

### 2. 类型错误

```bash
Property 'xxx' does not exist on type
```

**解决方案：**
```bash
npm run db:generate  # 重新生成类型
```

### 3. 迁移冲突

```bash
Migration xxx failed
```

**解决方案：**
```bash
npm run db:migrate:reset  # 重置迁移
npm run db:push           # 重新推送
npm run db:seed           # 重新填充
```

## 🔮 下一步

1. **扩展模板** - 添加更多项目模板
2. **实时协作** - WebSocket + Prisma 订阅
3. **文件版本** - 实现 Git 风格的文件历史
4. **权限细化** - 更精细的协作权限控制
5. **性能监控** - 添加查询性能分析

---

🎉 现在你已经可以使用 Prisma + Supabase 构建类型安全的在线代码编辑器了！ 