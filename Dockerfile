# 生产环境 Dockerfile
FROM node:20-alpine

# 安装必要的系统依赖
RUN apk add --no-cache \
    curl \
    openssl \
    git \
    ca-certificates

WORKDIR /app

# 设置npm配置
RUN npm config set registry https://registry.npmmirror.com/

# 复制 package 文件
COPY package.json package-lock.json* ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 生成 Prisma 客户端
RUN npx prisma generate

# 创建数据目录
RUN mkdir -p /app/data

# 构建生产版本
ENV NODE_ENV=production
RUN npm run build

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# 启动生产服务器
CMD ["npm", "start"]
