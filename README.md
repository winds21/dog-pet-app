# 🐶 狗狗养成互动网页项目

一个基于 **Vue3 + Node.js + Express + MySQL** 的全栈互动小应用：陪伴一只可爱的小狗，通过喂食与抚摸提升它的饱食度、愉悦度与亲密度，状态实时保存到数据库。

## ✨ 功能特性

- 🐕 可爱的狗狗展示形象，会根据心情切换表情（开心 / 普通 / 难过）
- 📊 三种状态指标可视化进度条：饱食度、愉悦度、亲密度
- 🍖 喂食按钮：饱食度 +10
- 🤚 抚摸按钮：愉悦度 +10、亲密度 +5
- 💾 状态数据持久化到 MySQL（`pet_db.pet_stats`）
- ✨ 互动反馈：漂浮特效（骨头/爱心）+ 动画提示

## 📁 项目结构

```
宠物展示学习ai项目/
├── database/
│   └── init.sql                 # MySQL 建库建表脚本
├── backend/                     # Node.js + Express 后端
│   ├── src/
│   │   ├── config/db.js         # MySQL 连接池配置
│   │   ├── controllers/
│   │   │   └── petController.js  # 获取状态/喂食/抚摸 逻辑
│   │   ├── routes/
│   │   │   └── petRoutes.js     # 路由定义
│   │   └── app.js               # Express 入口
│   ├── .env.example             # 环境变量模板
│   ├── .env                     # 环境变量（需自行填写密码）
│   └── package.json
├── frontend/                    # Vue3 + Vite 前端
│   ├── src/
│   │   ├── api/pet.js           # 后端 API 封装
│   │   ├── components/
│   │   │   ├── DogDisplay.vue   # 狗狗展示与动画
│   │   │   ├── StatusBar.vue    # 状态进度条
│   │   │   └── ActionButtons.vue# 喂食/抚摸按钮
│   │   ├── views/PetHome.vue    # 主页面
│   │   ├── App.vue
│   │   ├── main.js
│   │   └── style.css
│   ├── index.html
│   ├── vite.config.js           # 配置 /api 代理到后端
│   └── package.json
└── README.md
```

## 🚀 快速开始

### 1. 准备 MySQL 数据库

启动本地 MySQL，执行建表脚本：

```bash
mysql -u root -p < database/init.sql
```

或用 Navicat / MySQL Workbench 打开 `database/init.sql` 运行。
脚本会自动创建 `pet_db` 库与 `pet_stats` 表，并插入一条初始狗狗数据。

### 2. 启动后端

```bash
cd backend
npm install
# 修改 .env 中的 DB_PASSWORD 为你的 MySQL 密码
npm run dev
```

后端运行在 http://localhost:3000

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端运行在 http://localhost:5173 （会自动打开浏览器）

## 🔌 API 接口

| 方法   | 路径             | 说明                                  |
|--------|------------------|---------------------------------------|
| GET    | `/api/pet/stats` | 获取狗狗当前状态                       |
| POST   | `/api/pet/feed`  | 喂食（饱食度 +10，上限 100）          |
| POST   | `/api/pet/pet`   | 抚摸（愉悦度 +10、亲密度 +5，上限 100）|

## 🛠 技术栈

- **前端**：Vue 3 (Composition API) · Vite · Axios
- **后端**：Node.js · Express · mysql2
- **数据库**：MySQL

## 📝 数据表结构 `pet_stats`

| 字段       | 类型       | 说明                  |
|------------|------------|-----------------------|
| id         | INT (PK)  | 主键自增              |
| pet_name   | VARCHAR    | 狗狗名字，默认"旺财" |
| satiety    | INT        | 饱食度 (0-100)        |
| happiness  | INT        | 愉悦度 (0-100)        |
| intimacy   | INT        | 亲密度 (0-100)        |
| created_at | TIMESTAMP  | 创建时间              |
| updated_at | TIMESTAMP  | 更新时间              |
