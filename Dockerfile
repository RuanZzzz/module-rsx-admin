# 第一阶段：使用 Node 构建 Vue 静态资源。
FROM node:22-alpine AS builder

WORKDIR /workspace

# 先复制依赖声明文件，让 npm install 的结果尽量复用 Docker 层缓存。
COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

# 第二阶段：使用 nginx 承载前端静态资源，并转发后端 API。
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /workspace/dist /usr/share/nginx/html

EXPOSE 80
