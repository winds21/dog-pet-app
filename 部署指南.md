# 🚀 狗狗养成项目 - 部署指南（SQLite 版）

本指南将指导你如何将本项目部署到 Render.com，生成一个可以公开访问的链接。

**🎉 好消息：项目已升级为 SQLite 数据库，完全免费，无需配置任何数据库服务！**

---

## 📋 部署前准备

1. **注册 Render 账号**
   - 访问 [https://render.com](https://render.com)
   - 使用 GitHub 账号注册（推荐），方便后续连接

2. **项目技术栈**
   - 前端：Vue 3 + Vite
   - 后端：Node.js + Express
   - 数据库：SQLite（零配置，文件级数据库）

---

## 📦 步骤一：推送代码到 GitHub

代码已推送到 GitHub：`https://github.com/winds21/dog-pet-app`

如果需要重新推送：
```bash
git add .
git commit -m "更新说明"
git push origin main
```

---

## ☁️ 步骤二：部署到 Render

### 方法 A：使用 render.yaml（推荐）

项目根目录已有 `render.yaml` 配置文件，Render 会自动识别。

1. 登录 [Render Dashboard](https://dashboard.render.com)
2. 点击 **New +** → **Import from repository**
3. 选择你的 GitHub 仓库 `dog-pet-app`
4. Render 会自动检测到 `render.yaml`，配置会自动填入
5. **配置环境变量**（SQLite 不需要数据库配置，但推荐添加）：
   ```
   NODE_ENV=production
   ```
6. 点击 **Create Web Service**

### 方法 B：手动配置

如果 render.yaml 没有生效，可以手动配置：

1. 点击 **New +** → **Web Service**
2. 选择 GitHub 仓库
3. 配置：
   - **Runtime**: Node
   - **Root Directory**: `/`
   - **Build Command**:
     ```bash
     cd frontend && npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     cd backend && npm install && node src/init-db.js && node src/app.js
     ```
   - **Instance**: Free
   - **Region**: Singapore（亚洲节点）
4. 点击 **Create Web Service**

---

## 🔍 步骤三：验证部署

### 1. 查看部署日志
在 Render 服务页面，可以看到实时部署日志。等待出现：
```
🐶 狗狗养成后端服务已启动
📦 前端静态文件已托管
```

### 2. 访问你的应用
部署成功后，Render 会提供一个 URL，类似：
```
https://dog-pet-app.onrender.com
```

### 3. 测试 API
```bash
# 健康检查
curl https://你的URL/api/health

# 获取狗狗状态
curl https://你的URL/api/pet/stats

# 喂食
curl -X POST https://你的URL/api/pet/feed
```

---

## 💾 SQLite 数据库说明

### 优势
- ✅ **完全免费** - 无任何费用
- ✅ **零配置** - 无需账号、密码、连接字符串
- ✅ **高性能** - 单机读取可达每秒数万次
- ✅ **零运维** - 无需启动、停止、备份

### 存储位置
- 数据库文件：`backend/data/pet.db`
- Render 免费版使用内存文件系统，服务重启后数据会丢失
- 如需持久化数据，需要升级到 Render 付费版（$7/月）

### 数据持久化方案
如果需要数据持久化（免费版数据会丢失）：
1. 升级 Render 付费版（支持持久磁盘）
2. 或使用其他免费 SQLite 服务：
   - [Turso](https://turso.tech) - 云 SQLite，免费版支持 500MB
   - [Litestream](https://litestream.io) - SQLite 备份工具

---

## ⚠️ 常见问题

### Q1: Render 免费版数据会丢失吗？
**是的**。Render 免费版使用临时文件系统，服务休眠或重启后数据会重置。
**解决方案**：升级到付费版（$7/月），或使用 Turso 云 SQLite。

### Q2: 页面打开但是空白？
**原因**：前端构建产物没有被正确托管。
**解决**：检查 `frontend/dist` 目录是否存在。如果不存在，手动构建。

### Q3: 点击按钮报错 /api/pet/feed 404？
**原因**：后端 API 路由问题。
**解决**：检查 Render 日志，确认后端启动成功。访问 `https://你的URL/api/health` 测试。

### Q4: 免费版有什么限制？
- Render 免费版：750 小时/月运行时间
- 休眠：15 分钟无访问后会休眠，下次访问需 30-60 秒唤醒
- 存储：临时文件系统，重启后数据丢失

### Q5: 如何绑定自定义域名？
1. 在 Render 服务 → Settings → Custom Domain
2. 输入你的域名
3. 按照提示配置 DNS 记录
4. 等待 SSL 证书颁发

---

## 📊 升级到付费版（可选）

如果需要更好的体验：
- Render 付费版：$7/月，实例不休眠，持久磁盘
- Turso 云 SQLite：免费版 500MB，付费版 $25/月起

---

## 🔧 本地开发

```bash
# 后端
cd backend
npm install
npm run dev

# 前端（另一个终端）
cd frontend
npm install
npm run dev
```

访问 http://localhost:5173

---

## 📚 相关链接

- [Render 文档](https://docs.render.com)
- [SQLite 官方文档](https://www.sqlite.org/docs.html)
- [better-sqlite3 文档](https://github.com/WiseLibs/better-sqlite3)
