# 系统架构

《国风炼金卡牌》的当前工程架构已经明确为 **Web/H5 单客户端 + NestJS 服务端 + 轻量管理后台** 的 monorepo 形态。抖音小游戏基于 H5 适配方案推进，`client/cocos-client/` 仅保留为 Archived Prototype。

当前开发阶段：**Pre-Alpha / Early Alpha**。

## 架构目标

- 用 `config/` 维护可共享的卡牌、卡池、合成、奖励、朝代和每日限制配置。
- 用 `server/` 承接玩家登录、抽卡、库存、碎片、图鉴、合成、签到和后台管理 API。
- 用 `web/` 承担唯一正式玩家客户端，覆盖 Web/H5 与抖音小游戏 H5 适配。
- 用 `admin-light/` 提供轻量运营管理入口，先覆盖卡牌、卡池、规则、配置、用户和仪表盘。
- 将 `client/cocos-client/` 标记为 Archived Prototype，仅保留历史原型参考价值。
- 用 AI 素材脚本、Colab Notebook 和预览页面支撑卡牌图像生产。

## 当前分层设计

```text
┌────────────────────────────────────────────────────────────┐
│ web/ Web/H5 正式客户端                                      │
│ Next.js 16 + React 19，玩家首页、抽卡、合成、卡册、签到       │
└────────────────────────────┬───────────────────────────────┘
                             │ /api rewrites
┌────────────────────────────▼───────────────────────────────┐
│ server/ NestJS + TypeORM                                    │
│ JWT、Swagger、玩家 API、后台 API、配置导入、素材任务          │
└────────────────────────────┬───────────────────────────────┘
                             │
┌────────────────────────────▼───────────────────────────────┐
│ SQLite（开发）/ PostgreSQL（生产规划）                       │
│ players、cards、pools、inventory、fragments、logs、configs   │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ admin-light/ Vue 3 + Ant Design                            │
│ 卡牌、卡池、配置、合成规则、用户、仪表盘、Prompt 管理          │
└────────────────────────────┬───────────────────────────────┘
                             │ /api proxy
                             ▼
                         server/

┌────────────────────────────────────────────────────────────┐
│ config/                                                     │
│ cards、draw_pools、merge_rules、daily_limits、dynasty_tags   │
│ duplicate_conversion_rules、weekly_collection_rewards        │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ client/cocos-client/ Archived Prototype                     │
│ 历史 Cocos 原型，仅保留参考价值，不再作为正式客户端路线推进    │
└────────────────────────────────────────────────────────────┘
```

## 项目结构图

```text
.
├── web/                       # Next.js 16 + React 19 玩家前端
├── server/                    # NestJS + TypeORM 后端 API
├── admin-light/               # Vue 3 + Ant Design 轻量后台
├── client/cocos-client/       # Archived Prototype，历史 Cocos 原型
├── config/                    # 共享游戏配置
├── db/                        # 数据库草案和迁移草稿
├── docs/                      # 产品、技术、架构和开发计划
├── 策划案/                    # 项目策划案
├── assets-source/             # AI 素材提示词和参考图
├── prototype/                 # 原型截图和视觉验证产物
└── *.py / *.ipynb             # AI 出图、批处理、监控工具
```

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

API 文档：

```text
http://localhost:3002/api/docs
```

## H5 / 抖音小游戏适配

正式客户端入口为 `web/`。抖音小游戏路线基于 H5 适配，不再投入 Cocos Creator 正式客户端开发。

适配原则：

- `web/` 是唯一正式玩家端代码入口。
- 页面以移动竖屏为主要交互约束，兼容 Web 调试和抖音小游戏 H5 容器。
- 平台能力通过适配层接入：抖音登录、分享、广告激励、支付、埋点和审核限制。
- 抽卡、库存、碎片、合成、签到、奖励领取等经济行为继续由 `server/` 作为权威源。
- `client/cocos-client/` 不再参与后续正式联调、功能开发或发布流程。

## 环境变量说明

`server/.env` 开发环境：

| 变量 | 用途 |
| --- | --- |
| `NODE_ENV` | 运行环境 |
| `PORT` | NestJS 服务端口，当前开发默认 `3002` |
| `DATABASE_TYPE` | `sqlite` 或 `postgres` |
| `DATABASE_URL` | SQLite 数据库文件路径 |
| `JWT_SECRET` | 管理员和玩家 JWT 签名密钥 |
| `JWT_EXPIRES_IN` | JWT 过期时间 |
| `UPLOAD_DIR` | 本地上传目录 |

生产环境规划额外需要：

| 变量 | 用途 |
| --- | --- |
| `DATABASE_HOST` | PostgreSQL 主机 |
| `DATABASE_PORT` | PostgreSQL 端口 |
| `DATABASE_USER` | PostgreSQL 用户 |
| `DATABASE_PASSWORD` | PostgreSQL 密码 |
| `DATABASE_NAME` | PostgreSQL 数据库名 |
| `REDIS_HOST` | Redis 主机，当前为生产规划项 |
| `REDIS_PORT` | Redis 端口，当前为生产规划项 |

`web/next.config.ts` 支持：

| 变量 | 用途 |
| --- | --- |
| `API_TARGET` | Next.js `/api/*` 代理目标，默认 `http://localhost:3002` |

## 数据库说明

当前后端使用 TypeORM。

- 开发环境：SQLite，默认 `server/data2.db`。
- 生产环境规划：PostgreSQL。
- Docker 编排中包含 PostgreSQL 和 Redis。
- Redis 尚未在 NestJS 模块中实际接入，目前属于生产基础设施规划项。
- TypeORM 实体位于 `server/src/database/entities/`。
- Seed 脚本位于 `server/src/seed/seed.ts`，用于创建管理员账号并导入卡牌、卡池、合成规则和配置。
- 当前数据库配置仍使用 `synchronize: true`，生产上线前必须改为版本化 migrations。

## 后端模块

`server/src/app.module.ts` 当前接入模块：

- `AuthModule`：后台管理员登录和 JWT。
- `GameAuthModule`：玩家注册、登录、资料和玩家 JWT。
- `CardsModule`：卡牌管理。
- `PoolsModule`：卡池管理。
- `MergeRulesModule`：合成规则管理。
- `ConfigsModule`：配置管理。
- `UsersModule`：用户管理。
- `DashboardModule`：后台仪表盘。
- `AssetsModule`：素材上传和访问。
- `AuditLogsModule`：后台审计日志。
- `PublicModule`：公开配置和数据接口。
- `ImageJobsModule`：素材生成任务。
- `GameDrawModule`：玩家抽卡、剩余次数、库存、图鉴、碎片。
- `GameMergeModule`：玩家通用合成、配方合成、碎片兑换、Lv12 合成。
- `GameDailyModule`：签到和玩家日常信息。

## 配置流转

```text
策划案 / docs
  -> config/*.json
  -> server/src/seed/seed.ts 导入数据库
  -> server/ Public API 与玩家 API
  -> web/ 玩家前端
  -> admin-light/ 后台管理
```

短期仍可手动同步配置；下一阶段应建立配置发布和版本管理流程，让后台管理系统成为生产配置入口。

## 素材流转

```text
卡牌设定
  -> prompt 草稿
  -> ComfyUI / Colab / Python 批量出图
  -> 人工筛选
  -> 命名、压缩、预览
  -> 本地上传 / 对象存储 / CDN
  -> card image_url / thumbnail_url 绑定
```

生产上线前需要完成对象存储和 CDN 接入，避免依赖本地素材路径。

## Project Status (2026-06)

MVP 完成情况：

- 玩家前端核心页面已具备，且部分流程已接入服务端 API。
- 后端服务已具备运行时玩家 API、后台管理 API、数据库实体和 Swagger 文档。
- 轻量管理后台已具备 CRUD 管理界面。
- 开发数据库和 seed 流程可用。
- `client/cocos-client/` 已归档为历史原型，正式客户端路线聚焦 Web/H5。

已实现功能：

- 玩家注册/登录、资料读取。
- 抽卡、剩余次数、库存、图鉴、碎片查询。
- 通用合成、配方合成、碎片兑换、Lv12 合成。
- 签到和玩家日常信息。
- 后台卡牌、卡池、配置、合成规则、用户、素材、审计和仪表盘接口。
- Vue 管理后台基础页面。

当前风险：

- 数据库同步策略不适合生产。
- 生产 PostgreSQL、Redis、对象存储、CDN 尚未完成真实联调。
- 抖音登录、广告、支付、风控和数据埋点缺失。
- 核心经济系统自动化测试不足。
- 管理后台仍是轻量版，权限粒度、审计闭环和配置发布流程不完整。

下一阶段开发重点：

- 将 `server` 的数据库策略迁移到正式 migrations。
- 为抽卡、保底、消耗、合成失败回滚、奖励领取补齐测试。
- 完成抖音平台账号体系、广告激励和支付校验。
- 建立生产素材发布链路：上传、压缩、对象存储、CDN、回填 URL。
- 完成部署、CI、日志、监控、限流和安全配置。

## 版本演进

- **Pre-Alpha / Early Alpha**：当前阶段。Web/H5、server、admin-light 和 config 聚焦推进；Cocos 原型归档。
- **Alpha**：玩家主链路完全服务端权威，Web/H5 完成抖音小游戏适配联调。
- **Beta**：接入运营后台配置发布、广告激励、支付、数据埋点、风控和生产数据库。
- **Soft Launch**：打磨经济系统、留存节奏、素材质量、平台发布流程和运维体系。
