1# GitHub 项目导入功能

## 功能概述

现在您可以通过 GitHub 链接动态导入 NextJS 模板项目到 sandbox 环境中，系统会自动下载项目、安装依赖并启动开发服务器。

## 使用方法

### 1. 在主界面导入

1. 在主页面顶部导航栏点击"从 GitHub 导入"按钮
2. 在弹出的对话框中输入 GitHub 仓库链接
3. 点击"开始导入"，系统会自动完成以下步骤：
   - 下载 GitHub 仓库到 sandbox 目录
   - 验证项目是否为有效的 Node.js 项目
   - 安装项目依赖
   - 准备开发环境

### 2. 支持的 URL 格式

- `https://github.com/owner/repo` - 下载整个仓库主分支
- `https://github.com/owner/repo/tree/branch` - 下载指定分支
- `https://github.com/owner/repo/tree/branch/subfolder` - 下载指定子文件夹
- `git@github.com:owner/repo.git` - SSH 格式链接

### 3. 示例项目

系统内置了一些推荐的示例项目链接：

- Next.js Hello World 示例
- Create React App
- Vite React TypeScript 模板

## API 端点

### GitHub 下载 API

**POST** `/api/github/download`

```json
{
  "githubUrl": "https://github.com/owner/repo"
}
```

**GET** `/api/github/download?url=<github-url>`

- 验证 GitHub URL 格式

### 项目设置 API

**POST** `/api/project/setup-github`

```json
{
  "githubUrl": "https://github.com/owner/repo"
}
```

### Sandbox 初始化 API (增强)

**POST** `/api/sandbox/init`

```json
{
  "type": "nextjs",
  "githubUrl": "https://github.com/owner/repo" // 可选
}
```

## 实现原理

### 1. GitHubDownloader 服务

- **URL 解析**: 支持多种 GitHub URL 格式
- **Git 克隆**: 使用浅克隆减少下载时间
- **子文件夹提取**: 支持只导入仓库的特定目录
- **项目验证**: 自动检测项目类型和有效性

### 2. 项目管理器集成

- **依赖安装**: 自动运行`npm install`
- **环境准备**: 设置开发服务器配置
- **状态管理**: 实时反馈下载和安装进度

### 3. 前端 UI 组件

- **GitHubProjectSetup**: 提供用户友好的导入界面
- **进度反馈**: 显示下载、安装、完成等状态
- **错误处理**: 详细的错误信息和建议

## 支持的项目类型

- ✅ Next.js 项目
- ✅ React 项目 (Create React App, Vite)
- ✅ Vue.js 项目
- ✅ Express.js 项目
- ✅ 其他 Node.js 项目

## 注意事项

1. **项目要求**: 导入的项目必须包含有效的`package.json`文件
2. **依赖安装**: 大型项目的依赖安装可能需要几分钟时间
3. **存储空间**: 确保系统有足够的磁盘空间存储项目文件
4. **网络连接**: 需要稳定的网络连接来下载 GitHub 仓库

## 故障排除

### 常见错误及解决方案

- **无效的 GitHub URL**: 检查 URL 格式是否正确
- **仓库不存在**: 确认仓库是公开的或您有访问权限
- **不是有效的 Node.js 项目**: 确保项目根目录有 package.json 文件
- **依赖安装失败**: 检查 package.json 中的依赖是否有效

### 日志查看

系统会在控制台输出详细的操作日志，包括：

- 下载进度
- 依赖安装状态
- 错误详情

## 更新历史

- **v1.0.0**: 基础 GitHub 导入功能
- 支持多种 URL 格式
- 自动依赖安装
- 用户友好的 UI 界面
