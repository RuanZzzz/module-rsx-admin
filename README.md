# module-rsx-admin

Vue 管理端，当前阶段用于学习前后端联调。

## 当前功能

- 登录页
- 工作台
- 模块管理
- 教学工具管理
- 文章管理
- Vite 开发代理转发 `/api` 到后端 `http://localhost:8083`

## 本地启动

当前 Vite 版本要求 Node 20.19+，本机建议使用 Node 22。

```bash
cd /Users/ruanshaoxiang/Desktop/project/app/module-rsx-admin
source ~/.zshrc
npm install
npm run dev
```

访问：

```text
http://localhost:5173
```

默认登录账号：

```text
admin / 123456
```

## 后端要求

后端 Compose 环境需要已启动：

```bash
cd /Users/ruanshaoxiang/Desktop/project/app/module-rsx-server
docker compose up -d --scale server=2
```

当前前端开发代理默认访问：

```text
http://localhost:8083
```

## 关键链路

```text
浏览器 localhost:5173
-> Vite dev server
-> /api 代理到 localhost:8083
-> Compose 后端容器 8082
-> MySQL / Redis
```
