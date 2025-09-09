# 生产环境 Dockerfile - 优化版本
FROM node:20-alpine AS base

# 安装必要的系统依赖
RUN apk add --no-cache \
    curl \
    openssl \
    git \
    ca-certificates

WORKDIR /app

# 设置npm配置 - 优化安装速度和稳定性
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set timeout 300000 && \
    npm config set maxsockets 15

# 依赖安装阶段
FROM base AS deps
COPY package.json package-lock.json* ./
# 使用重试机制安装生产依赖
RUN for i in 1 2 3; do \
        npm ci --only=production --silent --prefer-offline --no-audit --no-fund && break || \
        (echo "Attempt $i failed, retrying..." && sleep 5); \
    done && npm cache clean --force

# 开发依赖阶段
FROM base AS dev-deps
COPY package.json package-lock.json* ./
# 使用重试机制安装依赖
RUN for i in 1 2 3; do \
        npm ci --silent --prefer-offline --no-audit --no-fund && break || \
        (echo "Attempt $i failed, retrying..." && sleep 5); \
    done && npm cache clean --force

# 构建阶段
FROM base AS builder
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .

# 生成 Prisma 客户端
RUN npx prisma generate

# 构建生产版本
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 生产运行阶段
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 复制运行时依赖
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# 创建必要目录
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# 启动生产服务器
CMD ["node", "server.js"]
