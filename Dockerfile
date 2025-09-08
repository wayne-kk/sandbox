# 开发环境 Dockerfile - 官方镜像源版
FROM node:18-alpine

# 安装必要的系统依赖
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# 使用官方 npm 源

# 复制 package 文件
COPY package.json package-lock.json* ./

# 安装所有依赖（包括开发依赖）
RUN npm ci --include=dev && npm cache clean --force

# 复制源代码
COPY . .

# 生成 Prisma 客户端
RUN npx prisma generate

# 设置开发环境变量
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# 创建数据目录
RUN mkdir -p /app/data

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# 启动开发服务器
CMD ["npm", "run", "dev"]
