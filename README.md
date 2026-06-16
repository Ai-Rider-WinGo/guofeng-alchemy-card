# 国风炼金卡牌

> 面向抖音小游戏平台的竖屏国风历史卡牌收集项目。以中国历史人物、历史事件、兵器、典籍与朝代主题卡池为核心，构建"抽卡 + 合成 + 收集 + 升星 + 周期运营"的轻量卡牌闭环。

<p align="center">
  <img src="docs/showcase/readme-hero.png" alt="国风炼金卡牌项目封面" width="100%" />
</p>

<p align="center">
  <strong>把楚汉战争做成可抽、可收集、可合成的历史卡牌体验。</strong>
  <br />
  Next.js 前端 · Cocos 游戏客户端 · 配置化玩法系统
</p>

[![Engine](https://img.shields.io/badge/Next.js-16-000000)](https://nextjs.org/)
[![Language](https://img.shields.io/badge/TypeScript-strict%20ready-3178c6)](#技术栈)
[![Platform](https://img.shields.io/badge/Target-抖音小游戏-df2a3f)](#项目定位)
[![Status](https://img.shields.io/badge/Stage-MVP%20Pre--Alpha-c28b27)](#当前进度)

## 项目定位

《国风炼金卡牌》不是修仙炼丹模拟器，而是一款以中国历史知识与卡牌收集驱动的国风小游戏。"炼金"在本项目中作为品牌词，具体落到卡牌合成、碎片转化、重复卡升星、低阶卡熔合与图鉴进度成长。

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

## 分支策略

本项目采用 **GitHub Flow（单主干 + 短期功能分支）**：

```
main ────●────●────●────●────  唯一长期分支，永远可部署
          ↘    ↗    ↘    ↗
        feat/   fix/    ...     短期分支，做完即合，合完即删
```

日常开发流程：
1. 从 `main` 开出功能分支：`git checkout -b feat/xxx`
2. 在上面写代码、提交
3. 合并回 `main`，删除功能分支

## 当前进度

| 模块 | 状态 | 说明 |
| --- | --- | --- |
| 产品策划 | 已建立 | 总策划案、MVP 范围、数据模型 |
| 前端 | 原型中 | Next.js 16 + React 19 + Tailwind CSS，已具备抽卡/合成/卡册/任务等核心页面 |
| 配置数据 | 原型中 | draw_pools / merge_rules / cards 等玩法 JSON |
| Cocos 客户端 | 原型中 | Cocos Creator 3.8.8 工程，核心脚本骨架就绪 |
| 后端服务 | 规划中 | API 架构与模块规划就绪，待编码 |
| 数据库 | 规划中 | Schema 草案与迁移策略就绪 |
| 后台管理 | 规划中 | 用户运营/卡牌管理/数据统计模块规划就绪 |
| AI 素材 | 规划中 | 已有卡牌风格 prompt 基线，后续接 ComfyUI 批量出图 |

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 16 + React 19 + TypeScript + Tailwind CSS |
| 游戏客户端 | Cocos Creator 3.8.8 + TypeScript |
| 后端(规划) | Node.js / Python，Express / Fastify / FastAPI |
| 数据库(规划) | PostgreSQL + Redis |
| 运维(规划) | 对象存储 / CDN |

## 仓库结构

```text
.
├── README.md
├── CONTRIBUTING.md
├── .github/                   # PR/Issue 模板
├── 策划案/                    # 项目总策划案
├── config/                    # 玩法配置 JSON
├── docs/                      # 产品、技术、架构文档
├── assets-source/             # AI 素材生产提示词
├── web/                       # Next.js 前端工程
├── client/cocos-client/       # Cocos Creator 3.8.8 游戏客户端
├── server/                    # 后端 API
├── db/                        # 数据库 Schema
└── admin/                     # 后台管理
```

## 数据与内容体系

MVP 样例线采用"秦汉篇 / 楚汉战争"作为第一条验证链：

- `刘邦 + 纪信 -> 荥阳脱困`
- `项羽 + 章邯 -> 巨鹿之战`
- `荥阳脱困 + 鸿门宴 -> 楚汉相争`
- `楚汉相争 + 垓下之围 -> 大汉开国`

配置设计原则：

- 低阶卡也必须服务当前朝代主题，不投放无关杂牌。
- 每张卡保留历史简介、知识点、相关卡、合成提示与资源路径。
- 卡池支持常驻基础池、周期朝代池、限时高级池三层结构。
- 所有概率、奖励、卡池轮换与消耗规则优先进入配置表。

## 文档入口

- [项目总策划案](./策划案/国风炼金卡牌-项目整体策划案.md)
- [MVP 范围](./docs/mvp-scope.md)
- [技术栈与工程模块](./docs/technical-stack.md)
- [系统架构](./docs/architecture.md)
- [数据配置系统](./docs/data-model.md)
- [母卡总表](./docs/card-master-table.md)
- [素材产出总表](./docs/card-asset-inventory.md)
- [产品路线图](./docs/roadmap.md)
- [后续开发顺序](./docs/next-steps.md)
- [视觉设计说明](./docs/design.md)
- [卡牌 AI 出图风格基线](./assets-source/prompts/card-art-style.md)

## 开发原则

- 先做小卡池真闭环，再扩展全量历史内容。
- 先验证抽卡、库存、合成、卡册、奖励，再进入复杂战斗。
- 低级卡必须是有历史知识点的内容资产，而不是纯材料。
- 合成必须解释历史关系，不能只给数值结果。
- 经济参数、概率与活动节奏进入配置，不硬编码在 UI。

## 暂缓范围

- 复杂 PVP / 公会 / 交易市场 / 装备系统
- 大地图探索 / 修仙洞府系统
- 重世界观长动画
- 生产级支付、广告、运营后台（MVP 后接入）

## License

当前项目处于产品原型与 MVP 工程阶段，暂未声明开源许可证。未经项目维护者许可，请勿将素材、策划案或配置数据用于商业发布。
