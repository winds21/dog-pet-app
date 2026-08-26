# 🐶 狗狗养成互动项目 - 学习总结

> 项目地址：https://github.com/winds21/dog-pet-app
> 在线体验：https://dog-pet-app.vercel.app

---

## 一、项目技术方案

### 1.1 技术栈总览

| 层次 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **前端框架** | Vue 3 | ^3.4.31 | Composition API (script setup) |
| **构建工具** | Vite | ^5.3.3 | 极速开发服务器和构建 |
| **图表库** | ECharts | ^6.1.0 | 7 天状态折线图 |
| **HTTP 客户端** | Axios | ^1.7.2 | 前后端 API 通信 |
| **后端框架** | Express.js | ^4.19.2 | Node.js Web 框架 |
| **数据库** | SQLite (better-sqlite3) | ^13.0.3 | 嵌入式数据库，零配置 |
| **跨域处理** | CORS | ^2.8.5 | 解决前后端跨域问题 |
| **环境变量** | dotenv | ^16.4.5 | 配置管理 |
| **版本控制** | Git + GitHub | - | 代码管理 |
| **前端部署** | Vercel | - | 全球 CDN，零绑卡 |
| **后端部署** | Railway | - | Node.js 托管，免费额度 |

### 1.2 项目目录结构

```
dog-pet-app/
├── frontend/                    # 前端项目
│   ├── src/
│   │   ├── api/                 # API 接口封装
│   │   │   ├── config.js        # API 基础配置（支持环境变量）
│   │   │   ├── pet.js           # 狗狗操作接口
│   │   │   └── history.js       # 历史记录接口
│   │   ├── components/          # 组件
│   │   │   ├── DogDisplay.vue   # 狗狗 SVG 展示组件
│   │   │   ├── StatusBar.vue    # 状态条组件
│   │   │   └── WeeklyChart.vue  # 周图表组件
│   │   └── views/
│   │       └── PetHome.vue      # 主页面
│   ├── vite.config.js           # Vite 配置
│   └── vercel.json              # Vercel 部署配置
│
├── backend/                     # 后端项目
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js            # SQLite 数据库配置
│   │   │   └── history.js       # 历史记录模块
│   │   ├── controllers/
│   │   │   └── petController.js # 核心业务逻辑
│   │   ├── routes/
│   │   │   ├── petRoutes.js     # 狗狗操作路由
│   │   │   └── historyRoutes.js # 历史记录路由
│   │   ├── app.js               # Express 入口
│   │   ├── init-db.js           # 数据库初始化
│   │   └── historyBootstrap.js # 历史快照定时任务
│   └── package.json
│
├── package.json                 # 根目录配置
├── railway.toml                 # Railway 部署配置
├── vercel.json                  # Vercel 部署配置
└── .gitignore
```

### 1.3 数据库设计

```sql
-- 狗狗当前状态表
CREATE TABLE pet_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_name TEXT,                    -- 狗狗名字
    satiety INTEGER DEFAULT 50,       -- 饱食度 (0-100)
    happiness INTEGER DEFAULT 50,     -- 快乐度 (0-100)
    intimacy INTEGER DEFAULT 50,      -- 亲密度 (0-100)
    cleanliness INTEGER DEFAULT 80,    -- 清洁度 (0-100)
    energy INTEGER DEFAULT 80,        -- 精力值 (0-100)
    last_feed_at TEXT,                -- 上次喂食时间
    last_pet_at TEXT,                 -- 上次抚摸时间
    last_walk_at TEXT,                -- 上次散步时间
    last_clean_at TEXT,               -- 上次洗澡时间
    last_decay_at TEXT                -- 上次衰减计算时间
);

-- 历史记录表（每日快照）
CREATE TABLE pet_stats_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_date TEXT UNIQUE,          -- 记录日期 (YYYY-MM-DD)
    satiety INTEGER,
    happiness INTEGER,
    intimacy INTEGER,
    cleanliness INTEGER,
    energy INTEGER
);
```

### 1.4 核心功能

| 功能 | 说明 |
|------|------|
| **5 大状态** | 饱食度、快乐度、亲密度、清洁度、精力值 |
| **4 个操作** | 喂食🍖、抚摸🤚、散步🦮、洗澡🛁 |
| **状态衰减** | 每 30 秒自动计算，饱食-1、快乐-1、清洁-0.5、精力+1 |
| **冷却系统** | 喂食 10s、抚摸 5s、散步 30s、洗澡 60s |
| **喂食惩罚** | 饱食度 >= 90 时，喂食仅+5且快乐-5 |
| **精力惩罚** | 精力 < 20 时，散步效果减半 |
| **心情提示** | 9 类状态共 27 条心情文案 |
| **彩蛋系统** | 散步随机触发 3 种结果（找到骨头、捡到球、什么都没找到） |
| **取名功能** | 支持给狗狗起名字，存到数据库 |
| **周图表** | ECharts 展示 7 天状态趋势 |
| **自动快照** | 每小时检查，00:01 自动记录当日状态 |

---

## 二、开发与部署遇到的问题

### 2.1 数据库选型问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| PlanetScale 收费 | 原免费方案现在要求 $5/月 | 改用 SQLite（better-sqlite3） |
| MySQL 连接配置复杂 | 需要用户名、密码、端口配置 | SQLite 零配置，直接文件 |
| Railway 上 MySQL 不可用 | 免费版不支持外部数据库 | SQLite 内嵌，持久化存储 |

### 2.2 SQLite 迁移问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 数据库表不存在 | Railway 全新环境无数据 | 启动时自动 `CREATE TABLE IF NOT EXISTS` |
| 数据持久化 | Railway 重启会丢失数据 | 使用 `CYCLIC_STACK_DATA_PATH` 环境变量 |
| 时间类型 | SQLite 无 DATETIME 类型 | 使用 TEXT (ISO 8601 字符串) |

### 2.3 部署平台问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| Render 要求绑卡 | 免费版也要验证信用卡 | 改用 Vercel + Railway |
| Cyclic.sh 无法访问 | 国内网络问题 | 改用 Railway |
| Railway 识别不到 Node.js | 没有 package.json | 在根目录创建 package.json |
| Railway Build Command 错误 | `cd backend && npm install` 在 backend 目录下找不到 backend | 直接用 `npm install` |
| Vercel 构建失败 | Root Directory 没设置 | 设置为 `frontend` |
| esbuild install scripts 被阻止 | Node 20+ 默认禁用 | 添加 `.npmrc` 配置 |
| package.json 有 BOM | PowerShell `Set-Content` 编码问题 | 用 Write 工具重写 |

### 2.4 本地开发问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| Git push 失败 | URL 有空格 | 修正为正确 URL |
| Git 用户未配置 | 没有 user.name/user.email | `git config user.name` |
| Vite 代理不生效 | API 路径问题 | 检查 `vite.config.js` proxy 配置 |
| npm install 慢 | 国内网络 | 配置镜像源 |

### 2.5 编码与部署问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| PowerShell `&` 操作符报错 | 命令中含特殊字符 | 用 `run_in_background` 执行 |
| Railway 健康检查失败 | 端口问题 | 监听 `process.env.PORT` |
| CORS 跨域 | 前后端不同域 | Express `cors()` 中间件 |
| SQLite WAL 模式 | 并发写入问题 | `db.pragma('journal_mode = WAL')` |

---

## 三、主要收获

### 3.1 技术层面

1. **全栈开发体验**
   - 前端：Vue 3 Composition API + Vite + ECharts
   - 后端：Express.js + SQLite + RESTful API
   - 部署：Vercel + Railway + GitHub Actions

2. **数据库知识**
   - MySQL vs SQLite 对比
   - SQLite WAL 模式、事务处理
   - 嵌入式数据库的优缺点

3. **部署平台对比**
   - Vercel：前端 SPA 首选，CDN 加速
   - Railway：后端 API 托管，支持持久化存储
   - 其他：Render、Netlify、Cyclic.sh、Glitch

4. **工程化能力**
   - 环境变量管理（`.env`、`.env.example`）
   - 构建配置（`vercel.json`、`railway.toml`）
   - 代码规范（`.gitignore`、ESLint）

### 3.2 问题解决能力

1. **问题排查思路**
   - 从错误信息入手，定位根因
   - 区分"现象"和"原因"
   - 善用日志和调试工具

2. **方案评估能力**
   - 对比不同技术方案的优缺点
   - 考虑成本、复杂度、可维护性
   - 快速验证可行性

3. **文档阅读能力**
   - 查阅 Vercel/Railway 官方文档
   - 理解配置项含义
   - 避免踩坑

### 3.3 项目管理

1. **迭代开发**
   - 从简到繁，逐步添加功能
   - 每个阶段可独立测试
   - 小步快跑，持续交付

2. **版本控制**
   - Git 分支管理
   - Commit message 规范
   - 代码回滚能力

3. **配置管理**
   - 开发/测试/生产环境切换
   - 敏感信息不入库
   - 配置文件模板化

### 3.4 最佳实践

1. **零配置优先**
   - SQLite > MySQL（无需安装配置）
   - 环境变量 > 硬编码（灵活切换）

2. **自动化部署**
   - GitHub 推送触发自动部署
   - 减少手动操作出错

3. **错误处理**
   - 启动时自动初始化（防御性编程）
   - 日志清晰可查
   - 优雅降级

---

## 四、项目链接

| 资源 | 地址 |
|------|------|
| **前端地址** | https://dog-pet-app.vercel.app |
| **后端地址** | https://dog-pet-app-production-8743.up.railway.app |
| **GitHub 仓库** | https://github.com/winds21/dog-pet-app |
| **后端健康检查** | https://dog-pet-app-production-8743.up.railway.app/api/health |

---

## 五、可扩展方向

如果继续优化，可以考虑：

1. **功能增强**
   - 多宠物支持
   - 成就系统
   - 每日任务
   - 商店系统（虚拟货币）

2. **数据持久化**
   - 接入 Turso（云 SQLite，免费）
   - 或 Railway 数据卷升级

3. **用户系统**
   - 注册登录
   - 多用户隔离
   - 数据备份

4. **移动端适配**
   - 响应式设计
   - PWA 支持
   - 小程序版本

---

## 📝 总结

这个项目从 0 到 1 完整实现了一个狗狗养成互动应用，覆盖了：
- **前端开发**：Vue3 + Vite + ECharts
- **后端开发**：Express.js + SQLite
- **部署运维**：Vercel + Railway + GitHub

过程中遇到了 **数据库选型、部署配置、编码问题、跨域处理** 等实际问题，通过排查和解决，积累了宝贵的全栈开发经验。

**核心收获**：遇到问题不要慌，看错误信息 → 分析原因 → 搜索文档 → 尝试方案 → 验证结果，一步一步解决！🐾
