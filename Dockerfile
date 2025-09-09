# ===============================
# Dockerfile - 支持 Sandbox dev / 预览版本
# ===============================

# -------------------------------
# 基础镜像
# -------------------------------
FROM node:20-alpine AS base

RUN apk add --no-cache \
    curl \
    openssl \
    git \
    ca-certificates \
    bash \

WORKDIR /app

# npm 配置优化
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set timeout 300000 && \
    npm config set maxsockets 15

# -------------------------------
# 安装生产依赖
# -------------------------------
FROM base AS deps
COPY package.json package-lock.json* ./
RUN for i in 1 2 3; do \
        npm ci --only=production --silent --prefer-offline --no-audit --no-fund && break || \
        (echo "Attempt $i failed, retrying..." && sleep 5); \
    done && npm cache clean --force

# -------------------------------
# 安装开发依赖（用于 Sandbox / dev）
# -------------------------------
FROM base AS dev-deps
COPY package.json package-lock.json* ./
RUN for i in 1 2 3; do \
        npm ci --silent --prefer-offline --no-audit --no-fund && break || \
        (echo "Attempt $i failed, retrying..." && sleep 5); \
    done && npm cache clean --force

# -------------------------------
# 构建阶段
# -------------------------------
FROM base AS builder
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .

# Prisma 客户端生成
RUN npx prisma generate

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# -------------------------------
# 生产运行阶段（主应用）
# -------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 拷贝构建产物
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 复制运行时依赖
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p /app/data && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]

# -------------------------------
# Sandbox 预览阶段
# -------------------------------
FROM node:20-alpine AS sandbox
WORKDIR /app

RUN apk add --no-cache bash

# 使用 dev-deps 依赖
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=development
ENV PORT=3100
ENV HOSTNAME="0.0.0.0"

RUN npx prisma generate || true  # sandbox 可忽略错误

EXPOSE 3100

CMD ["npm", "run", "dev"]
# ===============================
# Dockerfile - 支持 Sandbox dev / 预览版本
# ===============================

# -------------------------------
# 基础镜像
# -------------------------------
FROM node:20-alpine AS base

RUN apk add --no-cache \
    curl \
    openssl \
    git \
    ca-certificates \
    bash \
    python3 \
    make \
    g++

WORKDIR /app

# npm 配置优化
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set timeout 300000 && \
    npm config set maxsockets 15

# -------------------------------
# 安装生产依赖
# -------------------------------
FROM base AS deps
COPY package.json package-lock.json* ./
RUN for i in 1 2 3; do \
        npm ci --only=production --silent --prefer-offline --no-audit --no-fund && break || \
        (echo "Attempt $i failed, retrying..." && sleep 5); \
    done && npm cache clean --force

# -------------------------------
# 安装开发依赖（用于 Sandbox / dev）
# -------------------------------
FROM base AS dev-deps
COPY package.json package-lock.json* ./
RUN for i in 1 2 3; do \
        npm ci --silent --prefer-offline --no-audit --no-fund && break || \
        (echo "Attempt $i failed, retrying..." && sleep 5); \
    done && npm cache clean --force

# -------------------------------
# 构建阶段
# -------------------------------
FROM base AS builder
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .

# Prisma 客户端生成
RUN npx prisma generate

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# -------------------------------
# 生产运行阶段（主应用）
# -------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 拷贝构建产物
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 复制运行时依赖
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p /app/data && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]

# -------------------------------
# Sandbox 预览阶段
# -------------------------------
FROM node:20-alpine AS sandbox
WORKDIR /app

RUN apk add --no-cache bash

# 使用 dev-deps 依赖
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=development
ENV PORT=3100
ENV HOSTNAME="0.0.0.0"

RUN npx prisma generate || true  # sandbox 可忽略错误

EXPOSE 3100

CMD ["npm", "run", "dev"]
