# 如何访问独立预览页面

## 访问方式

### 1. 通过主页链接

1. 访问主页：`http://localhost:3000`
2. 点击顶部导航栏中的绿色"独立预览页面"按钮
3. 会自动跳转到：`http://localhost:3000/preview/sandbox-project`

### 2. 直接访问

直接在浏览器中访问：`http://localhost:3000/preview/sandbox-project`

## 预览功能说明

### 路由切换功能

在独立预览页面中，您可以看到：

1. **路由选择器**：页面顶部显示所有可用的路由页面
2. **页面切换**：点击任意路由按钮可以切换预览不同的页面
3. **页面信息**：显示当前页面的详细信息（路径、组件名、文件位置等）
4. **实时预览**：iframe 会根据选中的路由动态更新

### 当前可用的路由页面

根据 sandbox/app/ 目录，目前有 17 个页面可以预览：

- 首页 (/)
- BeautyHero (/BeautyHero)
- CarHero (/CarHero)
- ChildrenServicesHero (/ChildrenServicesHero)
- EcommerceHero (/EcommerceHero)
- FinanceHero (/FinanceHero)
- HealthcareHero (/HealthcareHero)
- HeroPinkTech (/HeroPinkTech)
- HeroTechPink (/HeroTechPink)
- LuxuryWatchHero (/LuxuryWatchHero)
- PetHero (/PetHero)
- PinkTechHero (/PinkTechHero)
- PinkTechLanding (/PinkTechLanding)
- TechHero (/TechHero)
- TechLanding (/TechLanding)
- TechLandingPage (/TechLandingPage)
- TechPinkHero (/TechPinkHero)

## 环境配置

### 开发环境

- **预览地址**：`http://localhost:3100`
- **CSP 配置**：允许 localhost 嵌入
- **CORS 配置**：允许 localhost:3000 访问

### 生产环境

- **预览地址**：`https://sandbox.wayne.beer`
- **CSP 配置**：限制为特定域名
- **CORS 配置**：限制为特定域名

## 故障排除

### 如果看不到路由选择器

1. 检查 sandbox 服务器是否运行：`http://localhost:3100`
2. 检查路由 API 是否正常：`http://localhost:3000/api/sandbox/routes`
3. 查看浏览器控制台是否有错误信息

### 如果预览无法加载

1. 确保 sandbox 服务器正在运行
2. 检查 CSP 配置是否正确
3. 查看网络请求是否被阻止

## 技术实现

- **路由检测**：自动扫描 `sandbox/app/` 目录
- **动态切换**：iframe src 根据选中路由动态更新
- **环境区分**：开发环境使用 localhost，生产环境使用子域名
- **实时更新**：支持热重载和实时预览
