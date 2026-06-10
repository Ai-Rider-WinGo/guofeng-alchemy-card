# 数据模型草案

## cards.json

卡牌母卡表。每一条代表一种可收集内容，不代表用户库存里的实体卡。

核心字段：

- `card_id`：卡牌唯一 ID
- `name`：卡名
- `level`：卡牌等级，MVP 使用 1-5 级
- `type`：person / place / event / system / force
- `dynasty`：朝代或历史阶段
- `rarity`：common / uncommon / rare / epic / legendary
- `tags`：检索和图鉴筛选标签
- `short_desc`：卡面一句话
- `story`：详情页历史小故事
- `knowledge_point`：学习点
- `related_cards`：相关卡 ID
- `merge_hint`：合成线索
- `image`：图片资源路径

## merge_rules.json

合成规则表。每条规则表示两张输入卡可合成一张输出卡。

核心字段：

- `rule_id`：规则 ID
- `input_a` / `input_b`：输入卡 ID
- `output`：输出卡 ID
- `target_level`：结果等级
- `success_rate`：MVP 阶段低级合成为 1
- `consume_inputs`：是否消耗输入卡
- `merge_desc`：合成时展示的历史关系说明

## draw_pools.json

抽卡池配置。MVP 只保留每日基础池和新手保护池。

核心字段：

- `pool_id`：卡池 ID
- `name`：卡池名
- `levels`：允许产出的等级
- `rarity_weights`：稀有度权重
- `active_card_ids`：当前池内可产出卡牌

## daily_limits.json

每日次数配置。后续接广告、分享、任务时扩展。

