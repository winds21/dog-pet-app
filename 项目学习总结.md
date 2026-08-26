# 🐶 狗狗养成互动项目 - 学习总结

> 项目地址：https://github.com/winds21/dog-pet-app
> 在线体验：https://dog-pet-app.vercel.app

---

## 一、项目概述

一个虚拟狗狗养成互动网页。用户**注册登录**后拥有属于自己的狗狗，通过喂食、抚摸、散步、洗澡提升它的各项状态。系统会根据**当天天气**影响互动效果，每天自动生成一篇**狗狗口吻的日记**记录当天生活，还可以切换**3 套皮肤**改变外观。

### 项目分两部分完成
1. **教程阶段**：跟着教程完成基础的 CRUD 和状态管理
2. **自主扩展**：教程之外，自己规划并实现了认证、天气、日记、换装等功能

---

## 二、技术栈

| 层次 | 技术 | 说明 |
|------|------|------|
| **前端框架** | Vue 3 | Composition API (`<script setup>`) |
| **构建工具** | Vite | 极速开发服务器和构建 |
| **路由** | Vue Router | 登录注册页面、路由守卫 |
| **图表库** | ECharts | 7 天状态折线图 |
| **HTTP 客户端** | Axios | 前后端 API 通信 + 拦截器 |
| **后端框架** | Express.js | Node.js Web 框架 |
| **认证** | JWT (jsonwebtoken) | 无状态身份认证 |
| **密码加密** | bcryptjs | 加盐哈希 |
| **数据库** | SQLite (better-sqlite3) | 嵌入式数据库，零配置 |
| **天气 API** | Open-Meteo | 免费，无需 API Key |
| **跨域处理** | CORS | 前后端跨域 |
| **前端部署** | Vercel | 全球 CDN |
| **后端部署** | Railway | Node.js 托管 |

---

## 三、功能列表

### 教程部分（跟着教程完成）

| 功能 | 说明 |
|------|------|
| **5 大状态** | 饱食度、快乐度、亲密度、清洁度、精力值 |
| **4 个操作** | 喂食🍖、抚摸🤚、散步🦮、洗澡🛁 |
| **状态衰减** | 每 30 秒自动计算 |
| **冷却系统** | 喂食 10s、抚摸 5s、散步 30s、洗澡 60s |
| **惩罚机制** | 过饱喂食效果减半、精力不足散步效果减半 |
| **心情提示** | 9 类状态共 27 条文案 |
| **彩蛋系统** | 散步随机触发 3 种结果 |
| **取名功能** | 给狗狗起名字 |
| **周图表** | ECharts 展示 7 天状态趋势 |
| **自动快照** | 每日自动保存状态数据 |

### 自主扩展（教程之外）

| 功能 | 说明 |
|------|------|
| **🔐 用户注册登录** | JWT + bcryptjs 加密，7 天有效期 |
| **👤 数据隔离** | 每个用户有自己的狗狗，所有查询带 user_id |
| **路由守卫** | 未登录访问 /pet 自动跳转登录页 |
| **Token 拦截器** | Axios 自动附加 Authorization 头 |
| **🌤️ 天气系统** | 接入 Open-Meteo 免费 API |
| **天气缓存** | 30 分钟内存缓存，减少 API 调用 |
| **天气影响心情** | 晴天 ×1.5、阴天 ×1.0、雨天 ×0.5 |
| **📖 狗狗日记** | 根据互动次数自动生成狗狗口吻日记 |
| **日记分页** | 历史日记翻页查看 |
| **🎨 换装系统** | 3 套皮肤（默认/戴帽子/穿披风） |
| **SVG 动画** | 帽子摇摆、披风飘动 |
| **乐观更新** | 切换皮肤先改 UI，失败回滚 |

---

## 四、数据库设计

```sql
-- 用户表
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,        -- bcryptjs 加密
    created_at TEXT DEFAULT (datetime('now'))
);

-- 狗狗状态表（每用户一行）
CREATE TABLE pet_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,           -- 外键关联 users
    pet_name TEXT,
    satiety INTEGER DEFAULT 50,
    happiness INTEGER DEFAULT 50,
    intimacy INTEGER DEFAULT 50,
    cleanliness INTEGER DEFAULT 80,
    energy INTEGER DEFAULT 80,
    skin TEXT DEFAULT 'default',        -- 皮肤字段
    today_feed_count INTEGER DEFAULT 0, -- 每日互动计数
    today_pet_count INTEGER DEFAULT 0,
    today_walk_count INTEGER DEFAULT 0,
    today_clean_count INTEGER DEFAULT 0,
    diary_date TEXT,
    last_feed_at TEXT,
    last_pet_at TEXT,
    last_walk_at TEXT,
    last_clean_at TEXT,
    last_decay_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 日记表
CREATE TABLE pet_diary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    diary_date TEXT NOT NULL,
    content TEXT NOT NULL,
    mood INTEGER NOT NULL,
    feed_count INTEGER DEFAULT 0,
    pet_count INTEGER DEFAULT 0,
    walk_count INTEGER DEFAULT 0,
    clean_count INTEGER DEFAULT 0,
    weather_type TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, diary_date)         -- 每天每用户只能一篇
);

-- 历史快照表
CREATE TABLE pet_stats_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    record_date TEXT,
    satiety INTEGER,
    happiness INTEGER,
    intimacy INTEGER,
    cleanliness INTEGER,
    energy INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 五、项目目录结构

```
dog-pet-app/
├── frontend/                         # 前端项目
│   ├── src/
│   │   ├── api/                      # API 接口封装
│   │   │   ├── config.js            # API 基础配置
│   │   │   ├── auth.js              # 认证 API（注册/登录）
│   │   │   ├── pet.js               # 狗狗操作 API
│   │   │   ├── diary.js             # 日记 API
│   │   │   ├── history.js           # 历史 API
│   │   │   └── weather.js           # 天气 API
│   │   ├── components/
│   │   │   ├── DogDisplay.vue        # 狗狗 SVG（支持 3 套皮肤）
│   │   │   ├── StatusBar.vue         # 状态条
│   │   │   └── WeeklyChart.vue      # 周图表
│   │   ├── views/
│   │   │   ├── Login.vue             # 登录页
│   │   │   ├── Register.vue          # 注册页
│   │   │   └── PetHome.vue            # 主页（含日记、换装）
│   │   ├── stores/
│   │   │   └── auth.js               # 认证状态管理
│   │   ├── router/
│   │   │   └── index.js              # 路由 + 路由守卫
│   │   ├── App.vue
│   │   └── main.js
│   ├── vite.config.js
│   └── vercel.json
│
├── backend/                          # 后端项目
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                 # SQLite 配置
│   │   │   └── history.js            # 历史记录模块
│   │   ├── controllers/
│   │   │   ├── authController.js     # 注册/登录/获取用户
│   │   │   └── petController.js      # 宠物互动 + 计数 + 换装
│   │   ├── middleware/
│   │   │   └── auth.js               # JWT 认证中间件
│   │   ├── routes/
│   │   │   ├── authRoutes.js         # /api/auth/*
│   │   │   ├── petRoutes.js          # /api/pet/*
│   │   │   ├── diaryRoutes.js        # /api/diary/*
│   │   │   ├── weatherRoutes.js      # /api/weather/*
│   │   │   └── historyRoutes.js      # /api/history/*
│   │   ├── services/
│   │   │   ├── diaryService.js       # 日记生成/查询
│   │   │   └── weatherService.js     # 天气 API + 缓存
│   │   ├── app.js                    # Express 入口
│   │   ├── init-db.js                # 数据库初始化 + 迁移
│   │   └── historyBootstrap.js       # 定时快照
│   └── package.json
│
├── LEARNING_JOURNEY.md              # 学习过程记录
├── REPORT_TEMPLATE.md               # 汇报话术模板
├── DEPLOY.md                         # 部署指南
├── railway.toml
└── package.json                      # 根目录配置
```

---

## 六、API 接口

### 认证 API（无需 token）
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/auth/me` | 获取当前用户（需 token） |

### 宠物 API（需 token）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/pet/stats` | 获取狗狗状态 |
| POST | `/api/pet/feed` | 喂食 |
| POST | `/api/pet/pet` | 抚摸 |
| POST | `/api/pet/walk` | 散步 |
| POST | `/api/pet/clean` | 洗澡 |
| POST | `/api/pet/rename` | 改名 |
| POST | `/api/pet/skin` | 换皮肤 |

### 日记 API（需 token）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/diary/today` | 获取/生成今日日记 |
| POST | `/api/diary/generate` | 强制重新生成 |
| GET | `/api/diary/list?page=1` | 分页查询历史 |

### 天气 API（无需 token）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/weather/current` | 当前天气 |
| GET | `/api/weather/multiplier` | 心情倍率 |
| POST | `/api/weather/refresh` | 强制刷新缓存 |

---

## 七、踩坑记录

### 7.1 教程阶段的问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| PlanetScale 收费 | 原免费方案改 $5/月 | 改用 SQLite |
| Render 要求绑卡 | 国内银行卡不支持 | 改用 Vercel + Railway |
| Railway 识别不到 Node.js | 没有根 package.json | 创建根目录 package.json |
| Vercel 构建失败 | BOM 字符 / Root Directory | 重写 + 设置目录 |
| esbuild 被阻止 | Node 20+ 默认禁用 | 添加 .npmrc |

### 7.2 扩展阶段的问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 线上注册失败 | API 双重路径 `/api/pet/api/auth` | 三个 API 文件独立硬编码 BACKEND |
| Vercel 没更新代码 | Redeploy 用了构建缓存 | 推新 commit 触发部署 |
| weatherService 用 require | 项目是 ESM | 改为顶部 import |
| 端口占用 | 旧进程未退出 | 杀掉占用进程 |

### 7.3 最难的坑：线上注册失败

**现象**：Vercel 上注册一直失败，本地正常。

**排查过程**（4-5 轮）：
1. ❌ 怀疑环境变量 → 不是
2. ❌ 怀疑代码没推 → 不是
3. ✅ **直接下载 Vercel 构建产物读源码** → 发现 baseURL 是 `/api/pet/api/auth`

**根因**：
- `config.js` 导出 `${BACKEND}/api/pet`
- `auth.js` import 后又拼 `/api/auth`
- 导致双重路径 → 404

**修复**：三个 API 文件各自独立硬编码 BACKEND。

**教训**：不要靠猜，要拿源码证据。

---

## 八、主要收获

### 8.1 教程部分
1. Vue3 Composition API、`<script setup>` 语法
2. Express 后端开发、RESTful API 设计
3. SQLite 数据库使用
4. 前后端联调（Axios、CORS、Vite 代理）

### 8.2 扩展部分
1. **JWT 认证**：无状态认证原理、token 签发与验证
2. **密码安全**：bcryptjs 加盐哈希
3. **数据隔离**：所有查询带 user_id
4. **第三方 API 集成**：Open-Meteo 天气 API
5. **缓存设计**：内存 Map + TTL
6. **内容生成**：模板 + 条件分支生成有趣日记
7. **分页查询**：LIMIT/OFFSET
8. **SVG 绘制**：手绘礼帽、披风
9. **CSS 动画**：@keyframes 摇摆、飘动
10. **乐观更新**：先改 UI，失败回滚
11. **线上问题排查**：证据驱动的系统化排查方法

### 8.3 方法论
1. **证据驱动**：不靠猜，用 HTTP 响应、源码、日志说话
2. **分层定位**：前端 → 网络 → 后端 → 数据库，逐层排除
3. **迭代开发**：从简到繁，小步快跑
4. **文档先行**：先查官方文档，再动手

---

## 九、项目链接

| 资源 | 地址 |
|------|------|
| **前端地址** | https://dog-pet-app.vercel.app |
| **后端地址** | https://dog-pet-app-production-8743.up.railway.app |
| **GitHub 仓库** | https://github.com/winds21/dog-pet-app |
| **后端健康检查** | https://dog-pet-app-production-8743.up.railway.app/api/health |

---

## 十、可扩展方向

1. **成就系统**：完成特定操作解锁成就
2. **多宠物支持**：每个用户可以养多只狗
3. **移动端适配**：响应式设计、PWA
4. **数据持久化升级**：接入 Turso（云 SQLite）
5. **商店系统**：虚拟货币 + 道具
6. **社交功能**：好友互访、狗狗互动

---

## 📝 总结

这个项目从跟着教程做基础功能，到自己规划扩展认证、天气、日记、换装等功能，完整经历了一个产品的从 0 到 1。

**教程教会了我基础**，但真正的成长来自于教程之外的扩展：
- 主动发现问题（收费、单用户、不真实）
- 主动设计方案（迁移、认证、天气影响）
- 主动面对困难（线上 bug 排查）

**核心收获**：遇到问题不要慌，看错误信息 → 拿证据 → 分析原因 → 搜索文档 → 尝试方案 → 验证结果，一步一步解决！🐾
