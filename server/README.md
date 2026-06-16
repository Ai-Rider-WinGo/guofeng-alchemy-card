# 国风炼金卡牌 · 后端服务

> 抖音小程序后端 API 服务。负责用户认证、抽卡逻辑、合成逻辑、卡牌数据管理、周期卡池调度等核心服务端逻辑。

## 技术栈（待定）

- 运行时：Node.js / Python / Go
- 框架：Express / Fastify / FastAPI / Gin
- 数据库：PostgreSQL / MySQL
- 缓存：Redis

## 目录结构（规划）

```
server/
├── src/
│   ├── routes/          # API 路由
│   │   ├── auth.ts      # 用户认证
│   │   ├── draw.ts      # 抽卡
│   │   ├── merge.ts     # 合成
│   │   ├── collection.ts # 图鉴/收集
│   │   ├── pool.ts      # 卡池管理
│   │   └── admin.ts     # 后台接口
│   ├── services/        # 业务逻辑
│   ├── models/          # 数据模型
│   ├── middleware/      # 中间件
│   └── index.ts         # 入口
├── tests/
├── package.json
└── tsconfig.json
```

## API 模块规划

| 模块 | 核心接口 |
|---|---|
| 用户认证 | 登录、游客注册、Token 刷新 |
| 抽卡 | 单抽、十连抽、保底计数、概率校验 |
| 合成 | 碎片合成、升星、熔合、配方查询 |
| 收集 | 卡册进度、朝代图鉴、收集奖励领取 |
| 卡池 | 周期池切换、概率配置、限时池上下架 |
| 后台 | 用户管理、卡牌CRUD、数据统计 |

## 状态

🚧 待开发 — 项目 Phase 1 MVP 阶段。
