# Sandbox 重置功能说明

## 功能概述

Sandbox 重置功能允许你选择性地清理项目：删除自定义组件，清理 app 目录，重置核心页面文件，同时保留重要的配置和依赖。

## 使用方法

### 在 IDE 界面中使用

1. 打开 IDE 编辑器界面
2. 在右上角工具栏中找到橙色的"重置"按钮（旋转箭头图标）
3. 点击"重置"按钮
4. 在弹出的确认对话框中查看将要执行的操作
5. 点击"确认重置"按钮完成重置

### 重置过程说明

重置功能将执行以下操作：

#### ✅ 会被删除的内容

- `components/` 目录下除了 `ui/` 文件夹外的所有自定义组件
- `app/` 目录下除了 `favicon.ico`, `globals.css`, `layout.tsx`, `page.tsx` 外的所有文件和文件夹

#### ✅ 会被重置的文件

- `app/layout.tsx` - 恢复到基础布局
- `app/page.tsx` - 恢复到默认首页

#### ✅ 会被保留的内容

- `components/ui/` - shadcn/ui 组件库完全保留
- `app/favicon.ico` - 网站图标
- `app/globals.css` - 全局样式文件（保留但不重置）
- `node_modules/` - 已安装的依赖包
- `.next/` - Next.js 构建缓存
- `package.json` - 项目配置和依赖
- `tsconfig.json` - TypeScript 配置
- `next.config.ts` - Next.js 配置
- `tailwind.config.js` - Tailwind CSS 配置
- `lib/` - 工具函数目录
- `public/` - 静态资源目录
- 其他配置文件

## API 端点

### GET /api/sandbox/reset

查看重置功能信息和模板详情

### POST /api/sandbox/reset

执行重置操作

```json
{
  "confirmReset": true
}
```

响应：

```json
{
  "success": true,
  "message": "Sandbox已成功重置",
  "details": {
    "resetAt": "2024-01-01T00:00:00.000Z",
    "deletedComponents": 8,
    "deletedAppItems": 5,
    "resetFiles": 2,
    "resetFilesList": ["app/layout.tsx", "app/page.tsx"],
    "preservedDirectories": ["node_modules", ".next", "components/ui"],
    "preservedAppFiles": [
      "favicon.ico",
      "globals.css",
      "layout.tsx",
      "page.tsx"
    ],
    "preservedFiles": ["其他配置文件保持不变"]
  }
}
```

## 使用场景

### 适合重置的情况

- ✅ 清理过多的自定义组件，重新整理项目结构
- ✅ 页面文件被过度修改，需要回到基础状态
- ✅ 实验性组件导致项目混乱
- ✅ 需要重新开始页面设计，但保留 UI 组件库

### 不建议重置的情况

- ❌ 只是想要删除单个组件（可以手动删除）
- ❌ 需要保留当前的页面布局
- ❌ 自定义组件中有重要的业务逻辑未备份

## 安全提示

⚠️ **重要警告：重置操作无法撤销！**

在执行重置之前，请确保：

1. 已保存或备份了重要的自定义组件代码
2. 确认不再需要当前的页面布局和内容
3. 理解重置会删除 components/ 下的自定义组件（ui/ 除外）

## 技术实现

- **前端组件**: `IntegratedIDE.tsx` - 主 IDE 界面中的重置按钮
- **确认对话框**: `ResetConfirmationDialog.tsx` - 重置确认 UI
- **API 路由**: `/api/sandbox/reset/route.ts` - 后端重置逻辑
- **文件操作**: 基于 Node.js fs 模块的文件系统操作

## 故障排除

### 常见问题

**Q: 重置按钮点击没有反应**
A: 检查项目是否正在运行中，重置会先停止项目

**Q: 重置后项目无法启动**
A: 尝试重新安装依赖：`npm install`

**Q: 静态文件丢失**
A: 部分静态文件（如图标）可能需要从主项目目录复制

**Q: 重置过程中断**
A: 可以再次点击重置按钮，API 会处理未完成的重置状态

### 日志查看

重置过程中的详细日志会显示在 IDE 的"日志"面板中，可以通过以下方式查看：

1. 点击工具栏中的"日志"按钮
2. 查看控制台输出
3. 检查浏览器开发者工具的 Network 面板

---

_该功能让你可以快速回到干净的开发环境，提高开发效率！_ 🚀
