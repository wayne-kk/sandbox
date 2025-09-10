# 基础镜像
FROM node:20-alpine AS base

RUN apk add --no-cache \
    curl \
    openssl \
    git \
    ca-certificates \
    bash 

WORKDIR /app

# npm 配置
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm config set fetch-retries 3 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set maxsockets 15

# 安装 pnpm
RUN npm install -g pnpm

# 设置 pnpm 镜像源和缓存目录
RUN pnpm config set registry https://registry.npmmirror.com && \
    pnpm config set store-dir /app/.cache/pnpm/store && \
    pnpm config set cache-dir /app/.cache/pnpm/cache
ENV PNPM_CACHE_DIR=/app/.cache/pnpm
RUN mkdir -p /app/.cache/pnpm

# 安装依赖
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prefer-offline

# 复制源代码（排除不需要的文件）
COPY src/ ./src/
COPY public/ ./public/
COPY prisma/ ./prisma/
COPY next.config.ts ./
COPY tsconfig.json ./
COPY tailwind.config.js ./
COPY postcss.config.mjs ./

# 生成 Prisma 客户端
ENV DATABASE_URL="file:./dev.db"
RUN npx prisma generate || echo "Prisma generate failed, continuing..."

# 构建
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# 生产运行
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 复制构建产物
COPY --from=base /app/public ./public
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/prisma ./prisma

# 安装生产依赖
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && \
    pnpm config set registry https://registry.npmmirror.com && \
    pnpm config set store-dir /app/.cache/pnpm/store && \
    pnpm config set cache-dir /app/.cache/pnpm/cache && \
    pnpm install --prod --frozen-lockfile --prefer-offline

RUN mkdir -p /app/data && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]

# Sandbox 开发环境
FROM base AS sandbox
ENV NODE_ENV=development
ENV PORT=3100
ENV HOSTNAME="0.0.0.0"

# 创建非root用户并设置权限
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 设置权限
RUN chown -R nextjs:nodejs /app
USER nextjs

RUN npx prisma generate || true

EXPOSE 3100
# CMD 由 docker-compose.yml 中的 command 覆盖