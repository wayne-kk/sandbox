# V0 Sandbox - 在线代码编辑器

支持运行完整的 Next.js 和 React 项目的在线代码编辑器。

## 功能特性

- 🎨 **Monaco 编辑器**: 基于 VS Code 的强大代码编辑体验
- 📁 **文件管理**: 支持多文件编辑和项目结构管理
- 🐳 **Docker 沙箱**: 安全隔离的项目运行环境
- ⚡ **实时预览**: 即时查看项目运行结果
- 💾 **自动保存**: 编辑时自动保存文件

## 技术栈

- **前端**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **编辑器**: Monaco Editor
- **容器化**: Docker
- **运行时**: Node.js 18

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### Docker 环境（可选）

确保 Docker 已安装并运行：

```bash
docker pull node:18
```

使用 Docker Compose:

```bash
docker-compose up
```

## 使用说明

1. 访问首页，点击"开始编码"进入编辑器
2. 在左侧文件浏览器中选择要编辑的文件
3. 在中央编辑器中编写代码（自动保存）
4. 点击终端中的"运行项目"按钮启动项目
5. 查看终端输出获取项目访问地址

## 项目结构

```
v0-sandbox/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/sandbox/        # 沙箱 API
│   │   ├── editor/             # 编辑器页面
│   │   ├── page.tsx            # 首页
│   │   └── layout.tsx          # 布局
│   ├── components/             # React 组件
│   │   └── Editor/             # 编辑器组件
│   └── lib/                    # 工具库
├── sandbox/                    # 沙箱项目文件
├── docker-compose.yml          # Docker 配置
└── Dockerfile                  # Docker 镜像
```

## API 接口

### 保存文件

```
POST /api/sandbox/save
```

请求体:
```json
{
  "fileName": "app/page.tsx",
  "content": "export default function..."
}
```

### 运行项目

```
POST /api/sandbox/run
```

请求体:
```json
{
  "type": "nextjs"
}
```

## 开发计划

- [ ] 支持更多项目模板
- [ ] 添加包管理功能
- [ ] 实现多用户支持
- [ ] 集成 WebSocket 实时协作
- [ ] 添加代码格式化和语法检查

## 注意事项

- 确保 Docker 已安装并运行（用于项目执行）
- 沙箱项目运行在端口 3001
- 文件自动保存到 `sandbox/` 目录

## License

MIT
