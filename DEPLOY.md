# 🚀 狗狗养成项目 - Render.com 部署指南

本指南将指导你如何将本项目部署到 Render.com，生成一个可以公开访问的链接。

---

## 📋 部署前准备

1. **注册 Render 账号**
   - 访问 [https://render.com](https://render.com)
   - 使用 GitHub 账号注册（推荐），方便后续连接

2. **准备 MySQL 数据库**
   - Render 免费版不提供 MySQL，你需要：
     - 选项 A：使用 Render 的 PostgreSQL（需修改代码）
     - 选项 B：使用第三方 MySQL 服务（推荐）
       - [PlanetScale](https://planetscale.com) - 免费 MySQL，Serverless 架构
       - [Neon](https://neon.tech) - 免费 PostgreSQL + MySQL 兼容
       - [阿里云 RDS](https://www.aliyun.com/product/rds) - 国内访问快

3. **把代码推送到 GitHub**（如果还没有）

---

## 📦 步骤一：推送代码到 GitHub

```bash
# 在项目根目录执行
git init
git add .
git commit -m "狗狗养成项目初始版本"
git remote add origin https://github.com/你的用户名/dog-pet-app.git
git push -u origin main
```

---

## 🗄️ 步骤二：配置 MySQL 数据库

### 方案 B：使用 PlanetScale（推荐，免费）

1. 访问 [https://planetscale.com](https://planetscale.com) 注册
2. 创建数据库 `pet-db`
3. 创建表结构：
   - 复制 `database/init.sql` 的内容
   - 在 PlanetScale 的 SQL Console 中执行
4. 获取连接信息：
   - Host: `xxxx.connect.psdb.cloud`
   - Username: `xxxx`
   - Password: `xxxx`
   - Database: `pet-db`

---

## ☁️ 步骤三：部署到 Render

### 方法 A：使用 render.yaml（推荐）

项目根目录已有 `render.yaml` 配置文件，Render 会自动识别。

1. 登录 [Render Dashboard](https://dashboard.render.com)
2. 点击 **New +** → **Import from repository**
3. 选择你的 GitHub 仓库
4. Render 会自动检测到 `render.yaml`，配置会自动填入
5. **配置环境变量**：

   在 Render 的服务设置中，添加以下环境变量：
   
   ```
   # MySQL 连接（从 PlanetScale 获取）
   MYSQL_URL=mysql://用户名:密码@主机地址/数据库名?ssl={"rejectUnauthorized":true}
   
   # 或者分开配置（两种方式任选其一）
   DB_HOST=主机地址
   DB_PORT=3306
   DB_USER=用户名
   DB_PASSWORD=密码
   DB_NAME=数据库名
   ```

6. 点击 **Create Web Service**

### 方法 B：手动配置

如果 render.yaml 没有生效，可以手动配置：

1. 点击 **New +** → **Web Service**
2. 选择 GitHub 仓库
3. 配置：
   - **Runtime**: Node
   - **Build Command**:
     ```bash
     cd backend && npm install && cd ../frontend && npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     cd backend && node src/app.js
     ```
   - **Instance**: Free
   - **Region**: Singapore（亚洲节点）

4. 添加环境变量（同上）
5. 点击 **Create Web Service**

---

## 🔍 步骤四：验证部署

### 1. 查看部署日志
在 Render 服务页面，可以看到实时部署日志。等待出现：
```
🐶 狗狗养成后端服务已启动
📦 前端静态文件已托管
✅ pet_stats_history 表已就绪
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

## ⚠️ 常见问题

### Q1: Render 部署失败，数据库连接错误？
**原因**：环境变量没有配置，或 MySQL 地址/密码错误。
**解决**：检查 Render 服务的 Environment 配置，确认 MYSQL_URL 或 DB_* 变量正确。

### Q2: 页面打开但是空白？
**原因**：前端构建产物没有被正确托管。
**解决**：检查 `frontend/dist` 目录是否存在。如果不存在，手动执行 `npm run build`。

### Q3: 点击按钮报错 /api/pet/feed 404？
**原因**：后端 API 路由问题。
**解决**：检查 Render 日志，确认后端启动成功。访问 `https://你的URL/api/health` 测试。

### Q4: 免费版有什么限制？
- Render 免费版：750 小时/月运行时间
- 休眠：15 分钟无访问后会休眠，下次访问需 30-60 秒唤醒
- 数据库：需要使用第三方服务

### Q5: 如何绑定自定义域名？
1. 在 Render 服务 → Settings → Custom Domain
2. 输入你的域名
3. 按照提示配置 DNS 记录
4. 等待 SSL 证书颁发

---

## 📊 升级到付费版（可选）

如果需要更好的体验：
- Render 付费版：$7/月，实例不休眠，更多内存
- 更快速的数据库：$4/月起

---

## 🔧 本地开发与生产环境切换

项目已支持环境切换：
- **本地开发**：`.env` 文件配置数据库，前端 Vite 代理 API
- **生产环境**：Render 环境变量配置数据库，Express 托管前端

---

## 📚 相关链接

- [Render 文档](https://docs.render.com)
- [PlanetScale 文档](https://planetscale.com/docs)
- [Vue3 部署指南](https://vuejs.org/guide/best-practices/performance.html)
