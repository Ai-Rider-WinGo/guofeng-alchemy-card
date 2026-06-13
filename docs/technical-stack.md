# 《国风炼金卡牌》技术栈与工程模块

## A. 前端游戏客户端

推荐技术：

- Cocos Creator 3.8+
- TypeScript
- 竖屏移动端适配
- 发布目标：抖音小游戏
- 后续可兼容 Web / 微信小游戏，但首发以抖音小游戏为主

前端模块：

- UI 页面系统
- 卡牌展示组件
- 抽卡动画组件
- 卡池 Banner 组件
- 卡册图鉴组件
- 合成列表组件
- 资源栏组件
- 任务组件
- 用户数据同步模块
- 广告激励调用模块
- 支付调用模块

## B. 后端服务

推荐技术：

- Node.js + TypeScript
- NestJS 或 Fastify
- PostgreSQL 作为主数据库
- Redis 用于缓存、限流、卡池状态、抽卡锁
- 对象存储用于卡牌图片、卡背、头像框等资源
- 管理后台用于配置卡池、卡牌、概率、活动、奖励

后端核心模块：

- 用户系统
- 卡牌配置系统
- 卡池配置系统
- 抽卡服务
- 合成服务
- 背包系统
- 卡册系统
- 任务系统
- 广告奖励发放系统
- 支付订单系统
- 日志与风控系统
- 运营配置后台

## C. 数据配置系统

必须支持以下配置表或配置文件：

- `card_definitions`：卡牌基础定义
- `card_rarity`：稀有度配置
- `card_types`：人物、事件、兵器、典籍
- `dynasty_tags`：朝代标签
- `gacha_pools`：卡池定义
- `gacha_pool_items`：卡池内容与权重
- `gacha_pool_rotation`：周期卡池轮换表
- `gacha_logs`：抽卡日志
- `user_cards`：用户拥有卡牌
- `user_card_shards`：用户碎片
- `user_collection_progress`：用户图鉴进度
- `synthesis_recipes`：合成配方
- `duplicate_conversion_rules`：重复卡转化规则
- `weekly_collection_rewards`：周期收集奖励
- `user_reward_claim_logs`：奖励领取日志

## D. AI 素材生产管线

保留 ComfyUI 作为本地高质量卡牌图像生产工具。

素材生产流程：

1. 在 Obsidian 维护卡牌设定文档
2. Codex 根据卡牌数据生成 prompt 草稿
3. ComfyUI 生成卡牌人物图、事件图、背景图
4. 人工筛选
5. 统一命名和压缩
6. 导入 Cocos 资源目录
7. 在 `card_definitions` 中绑定资源路径

素材规范：

- 卡牌主图比例：建议 3:4，首版 1024 x 1365 或 768 x 1024
- 卡面预览图比例：3:4，适配抽卡结果与详情页
- 缩略图比例：3:4，建议 256 x 341 或 128 x 171
- 卡背图比例：3:4，与卡牌主图一致
- 命名规则：`dynasty_type_name_rarity_version.png`
- 稀有度边框规则：按 common / uncommon / rare / SR / SSR 分层
- 朝代视觉标签规则：每个朝代配置主题色、纹样、角标和 Banner 关键词
- 资源压缩规则：首包只放必要 UI 与少量样例卡，卡牌主图走分包、CDN 或对象存储

## E. GitHub 与 Obsidian 协作

GitHub 负责：

- Cocos 项目代码
- 后端代码
- 配置 JSON / CSV
- 工具脚本
- README
- 技术文档

Obsidian 负责：

- 总策划案
- 玩法设计
- 卡牌世界观
- 朝代卡池设计
- 卡牌清单
- UI 草图说明
- 运营活动设计
- AI 出图 prompt 库

协作规则：

- GitHub 与 Obsidian 文档结构保持一致。
- 玩法方向、系统定义、术语表以 Obsidian 总策划案为源头。
- 工程字段、配置表、接口命名以 GitHub docs 为执行依据。
- 当策划变更影响配置或代码命名时，先在文档列重命名建议，再进入代码迁移。
