# 统一 Dockerfile - 多阶段构建优化版本
FROM node:18-alpine AS base

# 构建参数
ARG NODE_ENV=development
ARG BUILD_TARGET=dev

# 安装必要的系统依赖
RUN apk add --no-cache libc6-compat curl

WORKDIR /app

# 复制 package 文件
COPY package.json package-lock.json* ./

# 安装依赖
RUN npm ci --include=dev --silent && \
    npm cache clean --force

# 复制源代码
COPY . .

# 生成 Prisma 客户端
RUN npx prisma generate --silent

# 开发环境阶段
FROM base AS development
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["npm", "run", "dev"]

# 生产环境构建阶段
FROM base AS build
ENV NODE_ENV=production
RUN npm run build --silent

# 生产环境运行阶段
FROM node:18-alpine AS production
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# 复制构建产物
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma

# 只安装生产依赖
COPY package.json package-lock.json* ./
RUN npm ci --only=production --silent && \
    npm cache clean --force && \
    rm -rf /tmp/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]

# 默认使用开发环境
FROM development
