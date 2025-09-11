# 路由删除功能

## 概述

新增了删除单一路由文件夹的功能，允许用户在预览界面中直接删除不需要的路由页面。

## 功能特点

### 🗑️ **安全删除**

- **路径验证**：确保只能删除 sandbox 目录内的文件
- **保护机制**：防止删除重要文件（如 layout.tsx、page.tsx 等）
- **确认对话框**：删除前需要用户确认操作

### 🎯 **智能限制**

- **首页保护**：不能删除首页路由（`/`）
- **目录限制**：只能删除 `app/` 目录下的子目录
- **递归删除**：删除整个路由文件夹及其所有内容

### 🔄 **实时更新**

- **路由列表刷新**：删除后自动更新路由列表
- **自动切换**：删除当前路由后自动切换到首页
- **状态同步**：删除操作立即反映在界面上

## 使用方法

### 1. 在预览界面删除

1. 访问预览页面：`http://localhost:3000/preview/sandbox-project`
2. 在路由选择器中选择要删除的路由
3. 点击红色的"删除"按钮
4. 确认删除操作

### 2. 通过 API 删除

```bash
# 删除指定路由
curl -X DELETE "http://localhost:3000/api/sandbox/files?path=app/RouteName" \
  -H "Content-Type: application/json"
```

## API 接口

### DELETE /api/sandbox/files

**参数：**

- `path` (query): 要删除的路由路径，例如 `app/BeautyHero`

**响应示例：**

```json
{
  "success": true,
  "message": "Route directory deleted successfully: app/BeautyHero",
  "deletedPath": "app/BeautyHero"
}
```

**错误响应：**

```json
{
  "success": false,
  "error": "Route directory not found"
}
```

## 安全限制

### 受保护的文件/目录

- `package.json`
- `next.config.ts`
- `tailwind.config.js`
- `tsconfig.json`
- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`

### 删除限制

- ❌ 不能删除首页路由（`/`）
- ❌ 不能删除 `app` 根目录
- ❌ 不能删除受保护的文件
- ✅ 可以删除 `app/` 下的子目录（如 `app/BeautyHero`）

## 界面设计

### 删除按钮样式

- **位置**：路由选择器右侧
- **颜色**：红色主题（`bg-red-50`、`text-red-600`）
- **图标**：🗑️ 垃圾桶图标
- **状态**：只在非首页路由时显示

### 用户体验

- **确认对话框**：显示路由名称和路径
- **即时反馈**：删除成功后显示提示信息
- **自动切换**：删除当前路由后自动切换到首页
- **错误处理**：显示具体的错误信息

## 技术实现

### 后端实现

```typescript
// 递归删除目录
async function removeDirectoryRecursive(dirPath: string): Promise<void> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await removeDirectoryRecursive(fullPath);
    } else {
      await fs.unlink(fullPath);
    }
  }

  await fs.rmdir(dirPath);
}
```

### 前端实现

```typescript
const handleDeleteRoute = async (route: RouteInfo) => {
  // 确认删除
  if (!confirm(`确定要删除路由 "${route.name}" 吗？`)) {
    return;
  }

  // 从 filePath 中提取目录路径
  // 例如：从 "TechHero/page.tsx" 提取 "app/TechHero"
  const directoryPath = `app/${route.filePath.split("/")[0]}`;

  // 调用删除 API
  const response = await fetch(`/api/sandbox/files?path=${directoryPath}`, {
    method: "DELETE",
  });

  // 更新路由列表
  if (response.ok) {
    await loadRoutes();
  }
};
```

### 路径转换逻辑

路由检测 API 返回的 `filePath` 格式与删除 API 需要的路径格式不同：

- **路由检测 API 返回**：`"TechHero/page.tsx"` 或 `"xxx/yyy/page.tsx"`
- **删除 API 需要**：`"app/TechHero"` 或 `"app/xxx/yyy"`

因此需要在前端进行路径转换，支持嵌套路由：

```typescript
// 支持嵌套路由的路径转换
const pathParts = route.filePath.split("/");
const directoryName = pathParts.slice(0, -1).join("/"); // 移除最后的 "page.tsx"
const directoryPath = `app/${directoryName}`;
```

### 支持的删除场景

- ✅ **一级路由**：`app/BeautyHero` → 删除整个 BeautyHero 目录
- ✅ **嵌套路由**：`app/xxx/yyy` → 删除整个 yyy 目录
- ✅ **深层嵌套**：`app/a/b/c` → 删除整个 c 目录
- ✅ **自动清理空目录**：删除后自动删除空的父级目录

### 自动清理空目录功能

当删除嵌套路由时，系统会自动检查并删除空的父级目录：

**示例场景**：

```
app/test/nested/deep/page.tsx
```

删除 `app/test/nested/deep` 后：

1. 删除 `deep` 目录及其内容
2. 检查 `nested` 目录是否为空 → 为空，删除
3. 检查 `test` 目录是否为空 → 为空，删除
4. 检查 `app` 目录 → 不为空，停止删除

**API 响应示例**：

```json
{
  "success": true,
  "message": "Route directory deleted successfully: app/test/nested/deep",
  "deletedPath": "app/test/nested/deep",
  "removedParentDirs": ["app/test/nested", "app/test"]
}
```

## 注意事项

1. **备份重要数据**：删除操作不可逆，请确保重要数据已备份
2. **依赖关系**：删除路由前请检查是否有其他组件依赖该路由
3. **测试环境**：建议在测试环境中先验证删除功能
4. **权限控制**：确保只有授权用户可以执行删除操作

## 未来扩展

- [ ] 批量删除多个路由
- [ ] 删除前检查依赖关系
- [ ] 删除历史记录和恢复功能
- [ ] 更细粒度的权限控制
