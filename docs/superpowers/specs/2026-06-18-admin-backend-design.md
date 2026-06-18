# 国风炼金卡牌 —— 后台管理系统架构设计

> 日期：2026-06-18 | 状态：已确认

## 一、决策总览

| 决策项 | 结论 |
|--------|------|
| 后台前端 | vue-vben-admin (Vue 3 + Vite + TypeScript) |
| 后端框架 | NestJS (TypeScript) |
| 数据库 | PostgreSQL（火山引擎云数据库）+ Redis 缓存 |
| 对接方式 | API 中间层（REST API），不直接读写 JSON 文件 |
| 项目结构 | 同一仓库，新增 `server/` 和 `admin/` 目录 |
| 功能范围 | 全部：内容管理 + 权限 + 数据看板 + 运营工具 |
| 部署方式 | 开发期本地 SQLite 零成本，生产期火山引擎 ECS + PostgreSQL + Redis |
| 资产管线 | Python ComfyUI 管线保留，图片产出后上传至 TOS 对象存储 |

## 二、系统架构

```
┌─────────────────────────────────────────────────────────┐
│  运营/策划人员 (浏览器)                                    │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────┐
│  admin/  vue-vben-admin                                  │
│  Vue 3 · Vite · TypeScript                               │
│  内容管理 · 权限管理 · 数据看板 · 运营工具                   │
│  localhost:5173 (开发) / Nginx 静态部署 (生产)              │
└────────────────────────┬────────────────────────────────┘
                         │ REST API (JSON)
                         ▼
┌─────────────────────────────────────────────────────────┐
│  server/  NestJS API                                     │
│  Controller → Service → TypeORM                          │
│  认证守卫 · Swagger 文档 · 请求校验 · 操作日志               │
│  localhost:3000 (开发) / ECS (生产)                        │
└────────┬───────────────┬───────────────┬────────────────┘
         │               │               │
    ┌────▼────┐    ┌─────▼─────┐   ┌────▼────┐
    │ SQLite  │    │ PostgreSQL│   │  Redis  │
    │ (开发)  │    │ (生产)    │   │ (生产)  │
    └─────────┘    └───────────┘   └─────────┘

┌─────────────────────────────────────────────────────────┐
│  🎮 Cocos Creator 游戏客户端                              │
│  也从 API 拉取配置（生产环境），开发期直接读 JSON           │
└─────────────────────────────────────────────────────────┘
```

## 三、项目目录结构

```
guofeng-alchemy-card/
├── client/                  # Cocos Creator 游戏客户端 (不变)
├── config/                  # 现有 JSON 配置 (保留作参考)
├── docs/                    # 项目文档
│
├── server/                  # 新增：NestJS 后端 API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── cards/       # 卡牌管理 CRUD
│   │   │   ├── pools/       # 卡池配置
│   │   │   ├── merge/       # 合成规则
│   │   │   ├── config/      # 运营参数（每日限制、周期奖励等）
│   │   │   ├── auth/        # 认证鉴权（JWT + RBAC）
│   │   │   ├── users/       # 后台用户管理
│   │   │   ├── dashboard/   # 数据看板（聚合统计）
│   │   │   └── assets/      # 素材管理（上传/存储）
│   │   ├── common/          # 守卫、拦截器、装饰器
│   │   │   ├── guards/      # JWT 认证守卫、角色守卫
│   │   │   ├── interceptors/ # 日志拦截器、响应包装
│   │   │   └── decorators/  # 自定义装饰器
│   │   ├── database/
│   │   │   ├── entities/    # TypeORM 实体定义
│   │   │   └── migrations/  # 数据库迁移
│   │   └── main.ts
│   ├── .env                 # 开发环境 (SQLite)
│   ├── .env.production      # 生产环境 (PostgreSQL + Redis)
│   ├── package.json
│   └── tsconfig.json
│
├── admin/                   # 新增：vue-vben-admin 后台界面
│   ├── src/
│   │   ├── views/           # 各功能页面
│   │   │   ├── dashboard/   # 数据看板
│   │   │   ├── cards/       # 卡牌管理
│   │   │   ├── pools/       # 卡池配置
│   │   │   ├── merge/       # 合成规则
│   │   │   ├── config/      # 运营参数
│   │   │   ├── system/      # 用户/角色/权限管理
│   │   │   └── assets/      # 素材管理
│   │   └── api/             # 对接 server API 的请求层
│   ├── .env                 # 开发 API 地址
│   ├── .env.production      # 生产 API 地址
│   └── package.json
│
└── 版本 1/                  # Next.js H5 原型 (不变)
```

## 四、数据实体设计

### 核心业务表

| 实体 | 表名 | 说明 |
|------|------|------|
| 卡牌 | `cards` | 卡牌元数据：名称、品质、朝代、等级、图片、故事、知识标签 |
| 卡池 | `draw_pools` | 抽卡池：类型（基础/朝代/限定）、概率权重、卡牌范围、轮换时间 |
| 合成规则 | `merge_rules` | 合成公式：输入卡牌组合 → 输出卡牌、成功率、消耗材料 |
| 运营参数 | `game_configs` | 键值对：每日限制、碎片比例、周期奖励、签到奖励等 |
| 朝代 | `dynasties` | 朝代标签：名称、主题色、轮换优先级 |

### 系统表

| 实体 | 表名 | 说明 |
|------|------|------|
| 后台用户 | `admin_users` | 用户名、密码哈希、角色、状态 |
| 角色 | `roles` | 角色名、权限列表 |
| 操作日志 | `audit_logs` | 用户操作记录：谁、何时、做了什么、IP |

### 数据看板（聚合查询，不单独建表）

- 玩家 DAU / MAU
- 抽卡次数统计（按池/按时段）
- 合成次数统计
- 卡牌收集率排行
- 运营活动效果

## 五、API 模块划分

| 模块 | 路径前缀 | 核心接口 |
|------|---------|---------|
| 认证 | `/api/auth` | 登录、刷新 Token、登出 |
| 用户管理 | `/api/users` | CRUD、角色分配 |
| 卡牌管理 | `/api/cards` | CRUD、批量导入导出 |
| 卡池配置 | `/api/pools` | CRUD、概率权重调整 |
| 合成规则 | `/api/merge-rules` | CRUD、规则测试 |
| 运营参数 | `/api/configs` | 键值读写、批量更新 |
| 数据看板 | `/api/dashboard` | 聚合统计、趋势数据 |
| 素材管理 | `/api/assets` | 上传、列表、删除 |
| 操作日志 | `/api/audit-logs` | 查询、筛选、导出 |

## 六、开发 → 生产切换

### 切换清单

| 配置项 | 开发环境 | 生产环境 (火山引擎) |
|--------|---------|-------------------|
| 数据库 | `sqlite://./data.db` | `postgres://user:pass@pg.volcengine.com:5432/db` |
| 缓存 | 无（跳过） | `redis://redis.volcengine.com:6379` |
| 文件存储 | 本地 `./uploads/` | 火山引擎 TOS 对象存储 |
| 后台地址 | `http://localhost:5173` | `https://admin.your-domain.com` |
| API 地址 | `http://localhost:3000` | `https://api.your-domain.com` |

### 切换步骤

```bash
# 1. 替换环境变量
cp .env.production .env

# 2. 运行数据库迁移
npm run migration:run

# 3. 构建并启动
npm run build && npm run start:prod
```

**代码零改动。** TypeORM 抽象了数据库差异，NestJS 配置模块通过环境变量驱动。

## 七、后续实施计划

1. 搭建 NestJS 后端骨架（模块、认证、数据库）
2. 初始化 vue-vben-admin 项目并配置 API 代理
3. 实现卡牌管理模块（前后端联调）
4. 实现卡池、合成、参数配置模块
5. 实现权限管理和操作日志
6. 实现数据看板
7. 素材管理模块
8. 火山引擎部署配置

## 八、技术选型依据

| 选择 | 理由 |
|------|------|
| vue-vben-admin | 32.7k Stars，功能齐全（权限/表格/图表/主题），MIT 协议免费商用 |
| NestJS | 约定优于配置，AI agent 按模板生成不易出错；自带 Swagger/校验/ORM；与 vben 风格匹配 |
| TypeORM | NestJS 官方推荐，支持 SQLite→PostgreSQL 无缝切换 |
| SQLite (开发) | 零依赖、零成本、单文件、开箱即用 |
| PostgreSQL (生产) | 火山引擎原生支持，成熟稳定，功能丰富 |
| 火山引擎 | 与抖音同属字节系，内网互通低延迟，提供 ECS + PostgreSQL + Redis + TOS 全套服务 |
