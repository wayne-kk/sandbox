# Sandbox npm install 问题修复

## 问题描述

在云服务器上，sandbox项目运行的时候没有执行npm install，导致项目无法正常启动。

## 问题分析

通过代码分析发现以下问题：

1. **`/api/sandbox/start` 路由问题**：直接执行 `npm run dev`，但没有先检查并执行 `npm install`
2. **`/api/sandbox/run` 路由问题**：Docker模式下的npm install执行没有错误处理，本地模式超时时间过短
3. **缺少专门的依赖安装端点**：没有独立的API端点来处理依赖安装

## 修复内容

### 1. 修复 `/api/sandbox/start` 路由

**文件**: `src/app/api/sandbox/start/route.ts`

**修复内容**:
- 在启动开发服务器前检查 `package.json` 和 `node_modules` 是否存在
- 如果缺少 `node_modules`，自动执行 `npm install`
- 增加详细的错误处理和日志输出
- 设置合理的超时时间（2分钟）

**关键代码**:
```typescript
// 先检查是否需要安装依赖
const packageJsonPath = path.join(sandboxPath, 'package.json');
const nodeModulesPath = path.join(sandboxPath, 'node_modules');

let needsInstall = false;
try {
    await fs.access(packageJsonPath);
    try {
        await fs.access(nodeModulesPath);
    } catch {
        needsInstall = true;
    }
} catch {
    return NextResponse.json({
        success: false,
        error: 'package.json 文件不存在，请先初始化项目'
    }, { status: 400 });
}

// 如果需要安装依赖，先执行 npm install
if (needsInstall) {
    console.log('📦 检测到缺少 node_modules，正在安装依赖...');
    // ... 执行 npm install
}
```

### 2. 修复 `/api/sandbox/run` 路由

**文件**: `src/app/api/sandbox/run/route.ts`

**修复内容**:
- 改进Docker模式下的npm install错误处理
- 增加本地模式的超时时间（从30秒增加到2分钟）
- 添加详细的日志输出和错误信息

**关键代码**:
```typescript
// Docker模式
const installResult = await dockerManager.execInContainer('npm install --silent');
if (installResult.exitCode !== 0) {
    console.error('Docker容器中依赖安装失败:', installResult.stderr);
    throw new Error(`依赖安装失败: ${installResult.stderr}`);
}

// 本地模式
const { stdout: installOutput, stderr: installError } = await execAsync(command, {
    timeout: 120000, // 增加到2分钟超时
    cwd: sandboxDir,
});
```

### 3. 新增专门的依赖安装端点

**文件**: `src/app/api/sandbox/install/route.ts`

**功能**:
- `POST /api/sandbox/install`: 手动触发依赖安装
- `GET /api/sandbox/install`: 检查依赖安装状态

**特性**:
- 支持手动触发依赖安装
- 提供依赖状态检查
- 详细的错误处理和超时控制
- 3分钟超时时间

## 测试验证

### 测试脚本

创建了测试脚本 `test-sandbox-npm-install.sh` 来验证修复效果：

```bash
./test-sandbox-npm-install.sh
```

**测试步骤**:
1. 检查依赖状态
2. 手动触发依赖安装
3. 启动 sandbox 项目
4. 验证项目运行状态

### 手动测试

1. **检查依赖状态**:
   ```bash
   curl -X GET http://localhost:3000/api/sandbox/install
   ```

2. **手动安装依赖**:
   ```bash
   curl -X POST http://localhost:3000/api/sandbox/install
   ```

3. **启动项目**:
   ```bash
   curl -X POST http://localhost:3000/api/sandbox/start
   ```

## 部署说明

### 在云服务器上部署修复

1. **更新代码**:
   ```bash
   git pull origin main
   ```

2. **重新构建并启动**:
   ```bash
   ./deploy.sh --quick
   ```

3. **验证修复**:
   ```bash
   ./test-sandbox-npm-install.sh
   ```

### 验证步骤

1. 访问主应用: `http://your-server-ip:3000`
2. 尝试创建新的sandbox项目
3. 检查项目是否能正常启动
4. 查看日志确认npm install已执行

## 预期效果

修复后，sandbox项目启动流程将：

1. **自动检测依赖状态**：检查是否存在 `node_modules` 目录
2. **自动安装依赖**：如果缺少依赖，自动执行 `npm install`
3. **提供手动安装选项**：通过新的API端点手动触发依赖安装
4. **详细的错误处理**：提供清晰的错误信息和日志
5. **合理的超时控制**：避免因网络问题导致的安装失败

## 注意事项

1. **网络环境**：确保云服务器能够访问npm registry
2. **磁盘空间**：确保有足够的磁盘空间安装依赖
3. **权限问题**：确保应用有权限在sandbox目录中创建文件
4. **Node.js版本**：确保Node.js版本兼容项目依赖

## 故障排除

如果仍然遇到问题：

1. **检查日志**:
   ```bash
   docker compose logs -f app
   ```

2. **手动测试API**:
   ```bash
   curl -X POST http://localhost:3000/api/sandbox/install
   ```

3. **检查sandbox目录**:
   ```bash
   ls -la sandbox/
   ```

4. **检查网络连接**:
   ```bash
   curl -I https://registry.npmjs.org/
   ```
