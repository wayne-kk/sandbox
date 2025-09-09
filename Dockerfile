# 稳定版 Dockerfile - 开发环境 (Ubuntu基础镜像)
FROM node:20-slim

# 安装必要的系统依赖
RUN apt-get update && apt-get install -y \
    curl \
    openssl \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 设置npm配置
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5

# 复制 package 文件
COPY package.json package-lock.json* ./

# 分步安装依赖，增加重试机制
RUN npm cache clean --force
# 删除package-lock.json以确保使用最新的依赖版本
RUN rm -f package-lock.json
RUN npm install --include=dev --verbose --no-optional || \
    (sleep 10 && npm install --include=dev --verbose --no-optional) || \
    (sleep 20 && npm install --include=dev --verbose --no-optional)

# 确保Tailwind CSS正确安装
RUN npm list tailwindcss || npm install tailwindcss@^3.4.0 --save-dev

# 如果npm安装失败，安装编译工具并重试
RUN npm list tailwindcss || (apt-get update && apt-get install -y python3 make g++ && npm install tailwindcss@^3.4.0 --save-dev)

# 复制源代码
COPY . .

# 生成 Prisma 客户端
RUN npx prisma generate

# 创建数据目录
RUN mkdir -p /app/data

# 设置环境变量
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# 启动开发服务器
CMD ["npm", "run", "dev"]
