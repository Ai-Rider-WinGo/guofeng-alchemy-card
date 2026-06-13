# 数据配置系统

本项目的数据配置以“卡牌收集 + 周期朝代卡池 + 重复卡转化 + 每周收集奖励”为核心。MVP 阶段可以先用 JSON / CSV，后续进入后台管理和数据库。

## 必须配置表

### card_definitions

卡牌基础定义。每条代表一种可收集卡牌，不代表用户库存实体。

- `card_id`：卡牌唯一 ID
- `name`：卡名
- `rarity`：稀有度
- `type`：person / event / weapon / classic
- `dynasty_tag`：朝代标签
- `level`：卡牌层级
- `short_desc`：卡面短描述
- `story`：详情页历史简介
- `image_path`：卡牌主图路径
- `thumbnail_path`：缩略图路径
- `card_back_id`：卡背 ID
- `source_pool_ids`：可产出卡池

### card_rarity

稀有度配置。

- `rarity_id`
- `display_name`
- `weight_base`
- `frame_asset`
- `reveal_effect`

### card_types

卡牌类型。

- `person`：历史人物卡
- `event`：历史事件卡
- `weapon`：兵器卡
- `classic`：典籍卡

### dynasty_tags

朝代标签。

- `dynasty_tag`
- `display_name`
- `theme_color`
- `visual_keywords`
- `rotation_priority`

### gacha_pools

卡池定义。

- `pool_id`
- `name`
- `pool_type`：permanent / weekly_dynasty / limited_premium
- `dynasty_tag`
- `start_time`
- `end_time`
- `banner_asset`
- `featured_card_ids`
- `ticket_type`

### gacha_pool_items

卡池内容与权重。

- `pool_id`
- `card_id`
- `rarity`
- `weight`
- `is_featured`
- `min_level`
- `max_level`

### gacha_pool_rotation

周期卡池轮换表。

- `rotation_id`
- `week_index`
- `pool_id`
- `dynasty_tag`
- `theme_name`
- `start_time`
- `end_time`
- `next_pool_id`

建议轮换：

- 第 1 周：唐朝卡池
- 第 2 周：宋朝卡池
- 第 3 周：明朝卡池
- 第 4 周：三国卡池
- 第 5 周：秦汉卡池
- 第 6 周：春秋战国卡池
- 第 7 周：回到唐朝卡池

### gacha_logs

抽卡日志。

- `log_id`
- `user_id`
- `pool_id`
- `draw_count`
- `result_card_ids`
- `duplicate_card_ids`
- `converted_shards`
- `created_at`

### user_cards

用户拥有卡牌。

- `user_id`
- `card_id`
- `star`
- `quantity`
- `first_obtained_at`
- `last_obtained_at`

### user_card_shards

用户碎片。

- `user_id`
- `shard_type`
- `dynasty_tag`
- `card_id`
- `quantity`

### user_collection_progress

用户图鉴进度。

- `user_id`
- `dynasty_tag`
- `pool_id`
- `collected_count`
- `total_count`
- `reward_progress`
- `updated_at`

### synthesis_recipes

合成配方。

- `recipe_id`
- `target_card_id`
- `required_shards`
- `required_cards`
- `required_dynasty_tag`
- `cost_currency`
- `is_active`

### duplicate_conversion_rules

重复卡转化规则。

- `rule_id`
- `rarity`
- `level`
- `preferred_output`：star_material / dynasty_shard / premium_shard
- `shard_quantity`
- `can_star_up`
- `can_decompose`

规则建议：

- 重复 1 级卡：转化为同朝代碎片
- 重复 2 级卡：转化为该卡升星材料或同朝代碎片
- 重复 3 级及以上卡：优先用于该卡升星，也可分解为高级碎片
- 重复 SSR：用于升星、突破或兑换稀有资源

### weekly_collection_rewards

周期收集奖励。

- `reward_id`
- `pool_id`
- `dynasty_tag`
- `required_count`
- `reward_type`
- `reward_payload`

示例：

- 收集 10 张：金币奖励
- 收集 20 张：普通抽卡券
- 收集 30 张：高级抽卡券或随机 SR 唐朝卡
- 收集 36 张：唐朝限定头像框 / 称号 / 卡背

### user_reward_claim_logs

奖励领取日志。

- `log_id`
- `user_id`
- `reward_id`
- `pool_id`
- `claimed_at`

## 现有 JSON 对应关系

- `config/cards.json` 先对应 `card_definitions`
- `config/draw_pools.json` 先对应 `gacha_pools + gacha_pool_items + gacha_pool_rotation`
- `config/merge_rules.json` 先对应 `synthesis_recipes`
- `config/daily_limits.json` 先保留每日免费抽和广告奖励次数

后续建议新增：

- `config/duplicate_conversion_rules.json`
- `config/weekly_collection_rewards.json`
- `config/dynasty_tags.json`
