# V0 Sandbox - 在线代码编辑器

一个支持运行完整 Next.js 和 React 项目的在线代码编辑器。

## 🚀 功能特点

- **Monaco 编辑器**: 基于 VS Code 的强大代码编辑体验
- **多项目支持**: 支持 Next.js 和 React (Vite) 项目
- **Docker 沙箱**: 安全隔离的项目运行环境
- **实时编辑**: 代码自动保存，实时同步
- **文件管理**: 完整的文件浏览器和项目结构管理
- **终端输出**: 实时查看项目运行状态和错误信息

## 🛠️ 技术栈

- **前端**: Next.js 15 + React 19 + TypeScript
- **编辑器**: Monaco Editor (VS Code 内核)
- **样式**: Tailwind CSS
- **容器化**: Docker (可选)
- **运行环境**: Node.js 18+

## 📖 使用指南

### 1. 启动项目

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 2. 初始化沙箱项目

1. 访问编辑器页面
2. 在终端中选择项目类型（Next.js 或 React）
3. 点击"初始化项目"按钮
4. 等待项目文件创建完成

### 3. 编辑代码

1. 在左侧文件浏览器中选择文件
2. 在 Monaco 编辑器中编辑代码
3. 代码会自动保存到沙箱环境

### 4. 运行项目

1. 点击终端中的"运行项目"按钮
2. 等待依赖安装和项目启动
3. 访问 http://localhost:3001 查看项目效果
4. 使用"检查状态"按钮验证项目运行状态

## 🐳 Docker 支持

项目支持 Docker 容器运行，提供更好的隔离性和安全性：

```bash
# 启动 Docker 服务
docker --version

# 项目会自动检测 Docker 并优先使用容器运行
```

如果 Docker 不可用，系统会自动切换到本地运行模式。

## 📁 项目结构

```
v0-sandbox/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   └── sandbox/       # 沙箱相关 API
│   │   ├── editor/            # 编辑器页面
│   │   └── page.tsx           # 首页
│   ├── components/            # React 组件
│   │   └── Editor/            # 编辑器相关组件
│   │       ├── MonacoEditor.tsx
│   │       ├── FileExplorer.tsx
│   │       └── Terminal.tsx
│   └── lib/                   # 工具库
│       ├── docker.ts          # Docker 管理
│       ├── storage.ts         # 文件存储
│       └── templates.ts       # 项目模板
├── sandbox/                   # 沙箱项目目录
└── public/                    # 静态资源
```

## 🔧 配置选项

### 环境变量

创建 `.env.local` 文件配置环境变量：

```env
# 沙箱端口（默认 3001）
SANDBOX_PORT=3001

# 禁用遥测
NEXT_TELEMETRY_DISABLED=1
```

### Docker 配置

- 默认使用 `node:18` 镜像
- 限制容器资源使用
- 自动清理停止的容器

### 支持的文件类型

- **TypeScript/JavaScript**: `.ts`, `.tsx`, `.js`, `.jsx`
- **样式文件**: `.css`, `.scss`, `.less`
- **配置文件**: `.json`, `.yaml`, `.toml`
- **文档文件**: `.md`, `.txt`

## 🚨 注意事项

1. **首次运行**: 需要安装依赖，可能耗时较长
2. **端口占用**: 确保 3001 端口未被占用
3. **Docker 权限**: 确保 Docker 守护进程正常运行
4. **文件大小**: 建议单个文件不超过 1MB
5. **安全性**: 生产环境需要额外的安全配置

## 🔄 API 接口

### 项目管理
- `POST /api/sandbox/init` - 初始化项目
- `POST /api/sandbox/run` - 运行项目
- `POST /api/sandbox/stop` - 停止项目

### 文件操作
- `GET /api/sandbox/files` - 获取文件列表
- `POST /api/sandbox/save` - 保存文件

### 模板管理
- `GET /api/sandbox/templates` - 获取项目模板

## 🤝 贡献指南

欢迎贡献代码和反馈问题！

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

## 📝 更新日志

### v0.1.0
- 基础编辑器功能
- Next.js 项目支持
- Docker 容器运行
- 文件管理系统

### v0.2.0
- React 项目支持
- 项目模板系统
- 动态文件加载
- 改进的用户界面

## 📄 许可证

MIT License

## 🆘 故障排除

### 常见问题

**Q: 项目启动失败**
A: 检查端口 3001 是否被占用，确保 Node.js 版本 >= 18

**Q: Docker 相关错误**
A: 确保 Docker Desktop 正在运行，或禁用 Docker 使用本地模式

**Q: 文件保存失败**
A: 检查沙箱目录权限，确保应用有写入权限

**Q: 依赖安装慢**
A: 考虑配置 npm 镜像源或使用 Docker 预构建镜像

更多问题请查看 [Issues](https://github.com/your-repo/issues) 或提交新的问题报告。 