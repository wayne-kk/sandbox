FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装基础工具
RUN apk add --no-cache git curl

# 暴露端口
EXPOSE 3001

# 默认命令
CMD ["tail", "-f", "/dev/null"]