# V0 Sandbox 使用指南

## 🚀 快速开始

### 1. 启动项目
```bash
npm install
npm run dev
```
访问: http://localhost:3000

### 2. 进入编辑器
- 点击首页的 "开始编码" 按钮
- 进入编辑器界面: http://localhost:3000/editor

## 🎯 使用流程

### 步骤 1: 选择项目类型
在终端区域选择项目类型:
- **Next.js**: 完整的 Next.js 应用（推荐）
- **React**: 基于 Vite 的 React 应用

### 步骤 2: 初始化项目
1. 点击 "初始化项目" 按钮
2. 等待项目文件创建完成
3. 文件浏览器将显示项目结构

### 步骤 3: 编辑代码
1. 在左侧文件浏览器中点击文件
2. 在 Monaco 编辑器中编辑代码
3. 代码会自动保存

### 步骤 4: 运行项目
1. 点击 "运行项目" 按钮
2. 等待依赖安装（首次运行较慢）
3. 访问 http://localhost:3001 查看效果

## 🔧 功能说明

### 文件浏览器
- 📁 查看项目文件结构
- 🔄 刷新按钮更新文件列表
- 📝 点击文件名打开编辑

### Monaco 编辑器
- 💡 VS Code 同款编辑体验
- 🎨 语法高亮
- 🔍 自动完成
- ⚡ 自动保存

### 终端
- 🚀 初始化项目
- ▶️ 运行项目
- 🔍 检查状态
- ⏹️ 停止项目
- 🧹 清空输出

## 📦 项目模板

### Next.js 模板
包含以下文件:
- `app/page.tsx` - 首页组件
- `app/layout.tsx` - 根布局
- `app/globals.css` - 全局样式
- `components/Button.tsx` - 示例组件
- `package.json` - 项目配置

### React 模板
包含以下文件:
- `src/App.tsx` - 主应用组件
- `src/main.tsx` - 入口文件
- `src/index.css` - 样式文件
- `index.html` - HTML 模板
- `vite.config.ts` - Vite 配置

## 🐳 Docker 支持

### 自动检测
- 系统会自动检测 Docker 是否可用
- 优先使用 Docker 容器运行（安全隔离）
- Docker 不可用时自动切换到本地模式

### 手动启用 Docker
```bash
# 确保 Docker 正在运行
docker --version
docker info

# 拉取 Node.js 镜像
docker pull node:18
```

## ⚡ 快捷操作

### 键盘快捷键
- `Ctrl/Cmd + S`: 手动保存文件
- `Ctrl/Cmd + F`: 查找
- `Ctrl/Cmd + H`: 替换
- `Ctrl/Cmd + /`: 切换注释

### 常用按钮
- **初始化项目**: 创建新的项目文件
- **运行项目**: 启动开发服务器
- **检查状态**: 验证项目运行状态
- **停止项目**: 停止开发服务器
- **清空**: 清除终端输出

## 🚨 注意事项

### 性能提示
1. **首次运行**: 需要安装依赖，耗时 1-3 分钟
2. **端口占用**: 确保 3001 端口未被占用
3. **内存使用**: Docker 模式需要更多内存

### 常见问题
**Q: 项目启动失败？**
A: 检查端口占用，重启项目或换端口

**Q: 文件保存失败？**
A: 刷新页面，重新初始化项目

**Q: Docker 错误？**
A: 启动 Docker Desktop 或使用本地模式

**Q: 依赖安装慢？**
A: 配置 npm 镜像源或使用代理

### 限制说明
- 单个文件建议不超过 1MB
- 暂不支持文件上传
- 暂不支持多人协作
- 仅支持前端项目

## 🎮 示例项目

### Next.js 示例
试试编辑 `app/page.tsx`:
```tsx
export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-4">
        Hello, Next.js! 🚀
      </h1>
      <p className="text-gray-600">
        这是你的第一个沙箱项目
      </p>
    </div>
  );
}
```

### React 示例
试试编辑 `src/App.tsx`:
```tsx
import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)
  
  return (
    <div>
      <h1>React 计数器</h1>
      <button onClick={() => setCount(count + 1)}>
        点击次数: {count}
      </button>
    </div>
  )
}

export default App
```

## 🔄 API 接口

如需集成到其他系统，可以使用以下 API:

- `GET /api/sandbox/templates` - 获取项目模板
- `POST /api/sandbox/init` - 初始化项目
- `POST /api/sandbox/run` - 运行项目
- `GET /api/sandbox/files` - 获取文件列表
- `POST /api/sandbox/save` - 保存文件

## 📞 技术支持

- 🐛 Bug 反馈: 提交 GitHub Issues
- 💡 功能建议: 参与 Discussions
- 📖 文档: 查看 README.md
- 🛠️ 开发: 参考 DEPLOYMENT_SUCCESS.md

---

**🎉 开始你的编码之旅吧！** 