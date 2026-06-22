# 国风炼金卡牌

> 面向抖音小游戏平台的竖屏国风历史卡牌收集项目。以中国历史人物、历史事件、兵器、典籍与朝代主题卡池为核心，构建“抽卡 + 合成 + 收集 + 升星 + 周期运营”的轻量卡牌闭环。

<p align="center">
  <img src="docs/showcase/readme-hero.png" alt="国风炼金卡牌项目封面" width="100%" />
</p>

<p align="center">
  <strong>把楚汉战争做成可抽、可收集、可合成的历史卡牌体验。</strong>
  <br />
  Web/H5 正式客户端 · NestJS 服务端 · Vue 管理后台 · 抖音小游戏 H5 适配
</p>

[![Engine](https://img.shields.io/badge/Next.js-16-000000)](https://nextjs.org/)
[![Server](https://img.shields.io/badge/NestJS-10-e0234e)](https://nestjs.com/)
[![Admin](https://img.shields.io/badge/Vue-3-42b883)](https://vuejs.org/)
[![Status](https://img.shields.io/badge/Stage-Pre--Alpha%20%2F%20Early%20Alpha-c28b27)](#project-status-2026-06)

## 项目定位

《国风炼金卡牌》不是修仙炼丹模拟器，而是一款以中国历史知识与卡牌收集驱动的国风小游戏。“炼金”在本项目中作为品牌词，具体落到卡牌合成、碎片转化、重复卡升星、低阶卡熔合与图鉴进度成长。

首版目标聚焦一个清晰、可验证、可运营的 MVP 闭环：

```text
进入游戏
  -> 查看本周朝代主题卡池
  -> 免费抽卡 / 普通抽卡 / 高级抽卡
  -> 获得人物卡、事件卡、碎片或低阶卡
  -> 新卡点亮卡册
  -> 重复卡转化为碎片或升星材料
  -> 碎片足够后合成指定卡
  -> 推进本周主题收集进度
  -> 领取周期收集奖励
  -> 下周进入新朝代卡池
```

## Project Status (2026-06)

当前开发阶段：**Pre-Alpha / Early Alpha**。

MVP 完成情况：

- 产品策划、MVP 范围、核心玩法配置已建立。
- `web/` 已具备首页、抽卡、合成、卡册、卡牌详情、任务、签到、登录等核心页面。
- `server/` 已实现 NestJS API、TypeORM 实体、JWT 鉴权、玩家抽卡/合成/签到接口、后台管理接口与 Swagger 文档。
- `admin-light/` 已实现轻量 Vue 3 + Ant Design 管理后台，可操作卡牌、卡池、配置、合成规则、用户和仪表盘等模块。
- `config/` 已提供卡牌、卡池、合成、每日限制、朝代标签、重复卡转化和周期奖励等共享配置。
- `client/cocos-client/` 已标记为 Archived Prototype，仅保留历史原型参考价值，不再作为正式客户端路线投入开发。
- AI 素材生产脚本、Colab Notebook、参考图和预览页面已进入工程目录。

当前风险：

- 后端仍使用 TypeORM `synchronize: true`，生产上线前必须改为正式 migration。
- 开发环境使用 SQLite，生产规划使用 PostgreSQL；生产连接、迁移和备份流程尚未验证。
- Redis 已出现在生产配置和 Docker 编排中，但当前 NestJS 代码尚未实际接入缓存、限流或锁。
- 抖音平台登录、支付、广告激励校验、风控、监控和数据埋点仍未完成。
- README 之外的部分历史设计文档可能仍带有早期“本地 JSON / 多客户端并行”的表述，需要持续同步。
- `.env` 管理、生产密钥、对象存储/CDN 和部署流水线仍需规范化。

下一阶段开发重点：

- 将抽卡、库存、碎片、合成、签到和任务的玩家链路做端到端回归。
- 建立 PostgreSQL migration、seed、备份和环境隔离流程。
- 完成抖音登录绑定、广告激励和支付订单服务端校验。
- 为核心经济系统补齐自动化测试：概率、保底、消耗、失败回滚、奖励领取。
- 完成对象存储/CDN 接入和卡牌素材发布流程。
- 补齐生产部署、CI、日志、监控、限流和管理员审计。

## 架构概览

```text
web/ Web/H5 正式客户端（Next.js 16 + React 19）
  -> /api 代理
  -> server/ NestJS + TypeORM
  -> SQLite（开发）/ PostgreSQL（生产规划）

admin-light/ Vue 3 + Ant Design
  -> /api 代理
  -> server/ 后台管理 API

config/
  -> 卡牌、卡池、合成、每日限制、朝代标签、奖励等共享游戏配置

client/cocos-client/
  -> Archived Prototype，仅作历史原型参考
```

API 文档地址：

```text
http://localhost:3002/api/docs
```

## H5 / 抖音小游戏适配

正式客户端路线为 **Web/H5 单客户端**。抖音小游戏不再基于 Cocos Creator 继续开发，而是基于 H5 适配方案承接。

适配重点：

- 保持 `web/` 为唯一正式玩家端代码入口。
- 面向移动竖屏优化首页、抽卡、合成、卡册、任务、签到和个人信息页面。
- 抽象平台能力边界：登录、分享、广告激励、支付、埋点和审核限制。
- 保持服务端权威：抽卡、库存、碎片、合成、奖励领取等经济行为由 `server/` 校验和记录。
- 将 `client/cocos-client/` 作为 Archived Prototype，不再接入正式服务端联调或后续功能迭代。

## 启动方式

后端服务：

```bash
cd server
npm install
npm run seed
npm run start:dev
```

玩家前端：

```bash
cd web
npm install
npm run dev
```

轻量管理后台：

```bash
cd admin-light
npm install
npm run dev
```

开发默认端口：

| 模块 | 默认端口 | 说明 |
| --- | --- | --- |
| `server` | `3002` | NestJS API，`/api/docs` 为 Swagger |
| `web` | Next.js 默认端口 | `/api/*` 代理到 `API_TARGET`，默认 `http://localhost:3002` |
| `admin-light` | `5173` | `/api` 代理到 `http://localhost:3002` |
| `card_server.py` | `8888` | 可选素材服务，供 `admin-light` 代理 `/assets-output` |

## 环境变量

后端开发环境示例：

```text
NODE_ENV=development
PORT=3002
DATABASE_TYPE=sqlite
DATABASE_URL=./data2.db
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
```

后端生产环境规划：

```text
NODE_ENV=production
PORT=3000
DATABASE_TYPE=postgres
DATABASE_HOST=your-pg-host
DATABASE_PORT=5432
DATABASE_USER=your-user
DATABASE_PASSWORD=your-password
DATABASE_NAME=guofeng_alchemy
REDIS_HOST=your-redis-host
REDIS_PORT=6379
JWT_SECRET=your-secure-random-secret
JWT_EXPIRES_IN=7d
UPLOAD_DIR=/data/uploads
```

前端可选变量：

```text
API_TARGET=http://localhost:3002
```

## 数据库说明

- 开发环境默认使用 SQLite，数据库文件为 `server/data2.db`。
- 生产环境规划使用 PostgreSQL。
- `server/src/database/entities/` 包含当前 TypeORM 实体：管理员、玩家、卡牌、卡池、配置、库存、碎片、抽卡日志、合成日志、签到、素材任务、审计日志等。
- `server/src/seed/seed.ts` 会导入管理员账号、`import_cards.json`、`config/cards.json`、`draw_pools.json`、`merge_rules.json` 和其他配置。
- 当前仍使用 TypeORM `synchronize: true`，生产上线前必须切换为版本化 migrations。

## 当前进度

| 模块 | 状态 | 说明 |
| --- | --- | --- |
| 产品策划 | 已建立 | 总策划案、MVP 范围、数据模型、路线图 |
| 玩家前端 `web` | 已实现 Pre-Alpha | Next.js 16 + React 19，核心页面和 API 客户端已接入 |
| 后端 `server` | 已实现 Pre-Alpha | NestJS + TypeORM，玩家 API、后台 API、Swagger 和 seed 已具备 |
| 管理后台 `admin-light` | 已实现 Pre-Alpha | Vue 3 + Ant Design，支持卡牌、卡池、配置、规则、用户等管理 |
| 配置数据 `config` | 已建立 | 卡牌、卡池、合成、每日限制、朝代、奖励等 JSON 配置 |
| `client/cocos-client` | Archived Prototype | 历史 Cocos 原型，仅保留参考价值，不再投入正式客户端开发 |
| 数据库 | 开发可用 | SQLite 开发可用，PostgreSQL 为生产规划 |
| AI 素材 | 工具链原型中 | ComfyUI/Colab/批量生成脚本和预览页面已存在 |

## 技术栈

| 层 | 技术 |
| --- | --- |
| 玩家前端 | Next.js 16 + React 19 + TypeScript + Tailwind CSS |
| 后端 API | NestJS + TypeORM + JWT + Swagger |
| 管理后台 | Vue 3 + Ant Design Vue + Vite |
| 正式客户端 | Web/H5：Next.js 16 + React 19 + TypeScript + Tailwind CSS |
| 抖音小游戏适配 | H5 容器适配、平台登录、广告、支付、分享和审核约束 |
| 开发数据库 | SQLite |
| 生产数据库规划 | PostgreSQL |
| 生产基础设施规划 | Redis、对象存储、CDN、日志监控 |
| AI 素材生产 | ComfyUI、Python scripts、Colab notebooks |

## 仓库结构

```text
.
├── README.md
├── CONTRIBUTING.md
├── config/                    # 共享玩法配置 JSON
├── docs/                      # 产品、技术、架构、素材和开发计划文档
├── 策划案/                    # 项目总策划案
├── web/                       # Next.js 16 玩家前端
├── server/                    # NestJS + TypeORM 后端 API
├── admin-light/               # Vue 3 + Ant Design 轻量管理后台
├── client/cocos-client/       # Archived Prototype，历史 Cocos 原型
├── db/                        # 数据库草案和迁移草稿
├── assets-source/             # AI 素材提示词和参考图
├── prototype/                 # 原型截图和视觉验证产物
└── *.py / *.ipynb             # AI 卡牌生成、监控和批处理工具
```

## 已完成模块

- Next.js 玩家前端核心页面。
- NestJS API 基础框架、Swagger、统一响应、CORS、参数校验。
- 管理员 JWT 登录和玩家 JWT 登录/注册。
- 卡牌、卡池、合成规则、配置、用户、仪表盘、素材、审计日志等后台接口。
- 玩家抽卡、当日次数、库存、图鉴、碎片、合成、签到等运行时接口。
- Vue 轻量管理后台。
- TypeORM 实体和 SQLite 开发数据库。
- Seed 数据导入脚本。
- AI 素材生成脚本和预览资产。

## 待完成模块

- 抖音平台登录绑定。
- 支付订单和广告激励奖励服务端校验。
- Redis 缓存、限流、卡池状态锁和抽卡防刷。
- PostgreSQL migration 与生产数据迁移。
- 对象存储/CDN 文件上传、压缩和发布。
- 生产级监控、日志、告警和运营数据看板。
- H5 抖音小游戏适配：平台登录、广告激励、支付、分享、埋点和审核包。
- 自动化测试、CI、部署脚本和回滚流程。

## 生产环境上线前缺口

- 禁用 TypeORM `synchronize: true`，改为 migration。
- 提供 `.env.example`，清理本地开发密钥和生产密钥管理方式。
- 建立数据库备份、恢复、权限和数据隔离策略。
- 完成支付、广告、登录、风控和平台合规。
- 建立抽卡概率、保底、奖励、消耗、合成失败回滚的测试基线。
- 接入对象存储/CDN，避免生产依赖本地图片路径。
- 完成安全审计、接口限流、管理员操作审计和异常告警。

## 文档入口

- [MVP 范围](./docs/mvp-scope.md)
- [技术栈与工程模块](./docs/technical-stack.md)
- [系统架构](./docs/architecture.md)
- [后续开发顺序](./docs/next-steps.md)

## 暂缓范围

- 复杂 PVP / 公会 / 交易市场 / 装备系统
- 大地图探索 / 修仙洞府系统
- 重世界观长动画

## License

当前项目处于产品原型与 MVP 工程阶段，暂未声明开源许可证。未经项目维护者许可，请勿将素材、策划案或配置数据用于商业发布。
