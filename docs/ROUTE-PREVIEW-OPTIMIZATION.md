# 路由预览优化功能

## 概述

本次优化为预览系统添加了基于 Next.js 约定式路由的页面切换功能，用户可以在预览界面中轻松切换不同的页面进行预览。

## 新增功能

### 1. 路由自动检测

- 自动扫描 `sandbox/app/` 目录下的所有页面文件
- 支持 Next.js 约定式路由结构
- 检测每个路由的组件名称、文件路径和布局信息

### 2. 路由选择器

- 在预览界面顶部显示所有可用的路由页面
- 每个路由按钮显示页面名称、路径和布局状态
- 支持一键切换预览不同页面

### 3. 动态预览切换

- iframe 会根据选中的路由动态更新 URL
- 支持实时切换，无需刷新页面
- 保持预览状态和组件信息同步

### 4. 增强的页面信息

- 显示当前预览的页面信息
- 显示总页面数量和当前选中页面
- 提供详细的页面路径和组件信息

## API 接口

### GET /api/sandbox/routes

获取所有可用的路由信息

**响应示例：**

```json
{
  "success": true,
  "data": {
    "routes": [
      {
        "path": "/",
        "name": "home",
        "component": "HomePage",
        "isPage": true,
        "hasLayout": true,
        "filePath": "page.tsx"
      },
      {
        "path": "/TechHero",
        "name": "TechHero",
        "component": "TechHero",
        "isPage": true,
        "hasLayout": false,
        "filePath": "TechHero/page.tsx"
      }
    ],
    "total": 17,
    "baseUrl": "http://localhost:3100"
  }
}
```

## 使用方法

1. **访问预览页面**：打开任意项目的预览页面
2. **查看路由列表**：在预览界面顶部查看所有可用的页面路由
3. **切换页面**：点击任意路由按钮切换到对应的页面预览
4. **查看页面信息**：在路由选择器下方查看当前页面的详细信息

## 技术实现

### 路由检测逻辑

```typescript
// 递归扫描 app 目录
const scanDirectory = async (
  dir: string,
  routePath: string = ""
): Promise<void> => {
  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    if (item.isDirectory()) {
      await scanDirectory(fullPath, relativePath);
    } else if (item.name === "page.tsx") {
      // 检测到页面文件，添加到路由列表
      routes.push({
        path: routePath ? `/${routePath}` : "/",
        name: routeName,
        component: componentName,
        isPage: true,
        hasLayout,
        filePath: relativePath,
      });
    }
  }
};
```

### 动态预览切换

```typescript
// iframe 根据选中路由动态更新
<iframe
  src={selectedRoute ? `${sandboxUrl}${selectedRoute.path}` : sandboxUrl}
  key={`${sandboxUrl}-${selectedRoute?.path || "home"}`}
  // ... 其他属性
/>
```

## 支持的页面类型

- ✅ 首页 (`/`)
- ✅ 单页面路由 (`/PageName`)
- ✅ 嵌套路由 (`/Category/SubPage`)
- ✅ 动态路由 (`/[id]`)
- ✅ 布局检测 (检测是否有 `layout.tsx`)

## 环境配置

### 开发环境

- **预览地址**：`http://localhost:3100`
- **路由检测**：自动扫描 `sandbox/app/` 目录
- **实时更新**：支持热重载和实时预览
- **CSP 配置**：`frame-ancestors 'self' http://localhost:* http://127.0.0.1:*`
- **CORS 配置**：允许 `http://localhost:3000` 和 `http://127.0.0.1:3000`

### 生产环境

- **预览地址**：`https://sandbox.wayne.beer`
- **子域名方案**：使用独立的子域名进行预览
- **CDN 加速**：支持静态资源加速
- **CSP 配置**：`frame-ancestors 'self' https://wayne.beer https://sandbox.wayne.beer`
- **CORS 配置**：限制为 `https://wayne.beer` 和 `https://sandbox.wayne.beer`

## 注意事项

1. **文件命名**：页面文件必须命名为 `page.tsx`、`page.ts`、`page.jsx` 或 `page.js`
2. **目录结构**：遵循 Next.js 约定式路由的目录结构
3. **服务器状态**：确保 Sandbox 服务器正在运行 (端口 3100)
4. **实时更新**：新增页面后需要刷新预览页面以检测新路由
5. **环境切换**：开发环境使用 localhost，生产环境使用子域名

## 未来扩展

- [ ] 支持动态路由参数预览
- [ ] 添加页面搜索和过滤功能
- [ ] 支持页面预览缩略图
- [ ] 添加页面性能监控
- [ ] 支持页面间导航测试
