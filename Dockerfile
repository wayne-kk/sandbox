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
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set maxsockets 15

# 安装依赖
COPY package.json package-lock.json* ./
RUN for i in 1 2 3; do \
        npm ci --silent --prefer-offline --no-audit --no-fund && break || \
        (echo "Attempt $i failed, retrying..." && sleep 5); \
    done && npm cache clean --force

# 复制代码
COPY . .

# 生成 Prisma 客户端
RUN npx prisma generate

# 构建
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

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
COPY package.json package-lock.json* ./
RUN npm ci --only=production --silent && npm cache clean --force

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

RUN npx prisma generate || true

EXPOSE 3100
CMD ["npm", "run", "dev"]