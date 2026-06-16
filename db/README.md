# 国风炼金卡牌 · 数据库

> 数据库 Schema、Migration 和 Seed Data 管理。使用版本化迁移策略。

## 目录

```
db/
├── schema/           # 数据库表定义文档（ER 图、表结构说明）
├── migrations/       # 版本化迁移脚本（按时间戳命名）
└── seeds/            # 初始/测试数据种子
```

## 核心数据表（规划）

| 表名 | 说明 |
|---|---|
| `users` | 用户账户（UID、昵称、注册时间、VIP 等级） |
| `user_cards` | 用户持有卡牌（卡牌 ID、数量、星级、获取时间） |
| `user_fragments` | 用户碎片（碎片类型、数量） |
| `user_collections` | 图鉴点亮记录 |
| `user_draw_history` | 抽卡历史 |
| `cards` | 卡牌定义（ID、名称、稀有度、朝代、类型、星级上限） |
| `draw_pools` | 卡池定义（池 ID、类型、概率配置、保底规则） |
| `pool_schedules` | 卡池排期（朝代轮换、限时池上下架时间） |
| `merge_recipes` | 合成配方 |
| `weekly_rewards` | 每周收集奖励定义 |
| `daily_limits` | 每日限制配置 |
| `tasks` | 任务定义 |
| `user_tasks` | 用户任务进度 |

## 状态

🚧 待设计 — 将在技术选型后确定具体数据库引擎和 ORM。
