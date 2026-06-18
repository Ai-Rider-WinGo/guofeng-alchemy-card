# 统一数据模型 & 后台管理修复

> 日期：2026-06-19 | 方案 B

## 目标

让 admin-light 真正管理 server 数据库里的卡牌/卡池/合成规则，消除四套系统间的字段名和枚举值不一致。

## 统一数据模型

以 `config/cards.json` 为数据源，`docs/api-contract.md` 为命名标准。

### 卡牌 Card

| 字段 | 类型 | 改什么 |
|------|------|--------|
| `id` | number (PK) | 不变 |
| `card_id` | string unique | 不变 |
| `name` | string | 不变 |
| `rarity` | enum: N/R/SR/SSR/UR | **从 quality 改名，枚举值改为 N/R/SR/SSR/UR** |
| `level` | number 1-12 | 不变 |
| `type` | enum: person/event/weapon/classic/place/dynasty | **扩展，去掉 stage_event** |
| `dynasty` | string | 不变 |
| `dynasty_tag` | string | **新增字段** |
| `short_desc` | string | **新增** |
| `story` | string | 不变 |
| `knowledge_point` | string | 不变 |
| `tags` | string[] | 不变 |
| `related_cards` | string[] | 不变 |
| `merge_paths` | MergePath[] | **从 merge_hint 文本改为结构化** |
| `star_max` | number | **新增** |
| `image_url` | string | 不变（字段名不变） |
| `thumbnail_url` | string | 不变 |
| `is_active` | boolean | 不变 |

### 卡池 DrawPool

| 字段 | 改什么 |
|------|--------|
| `rate_weights` | **改为 `rarity_weights`，key 改为 N/R/SR/SSR/UR** |
| 新增 | `dynasty_tag`, `featured_card_ids`, `ticket_type`, `pity_config`, `collection_target` |

### 合成规则 MergeRule

| 字段 | 改什么 |
|------|--------|
| `input_card_ids` | **改为 `input_a` + `input_b` 匹配 config JSON** |
| 新增 | `merge_desc` |

### 响应格式

保持现状 `{ code, data, message }`，把 `docs/api-contract.md` 里的 `msg` 统一为 `message`。

## 修改范围

### server/ (NestJS)
1. `card.entity.ts` — 字段改名/新增
2. `draw-pool.entity.ts` — rate_weights → rarity_weights
3. `merge-rule.entity.ts` — input_card_ids → input_a/input_b
4. `cards/dto/` — DTO 对齐
5. `cards/cards.service.ts` — 适配
6. `dashboard/dashboard.service.ts` — 适配新字段名
7. `seed/seed.ts` — 从 `config/cards.json` 正确映射导入
8. `transform.interceptor.ts` — 不变，已是 `message`

### admin-light/ (Vue 3)
1. `Login.vue` — 去掉 dev-token 降级
2. `Dashboard.vue` — 重写，调 `/dashboard/overview`
3. `Cards.vue` — 重写为卡牌管理 CRUD 页面
4. `Pools.vue` — 检查对齐
5. `MergeRules.vue` — 检查对齐
6. `Configs.vue` — 检查对齐
7. `Users.vue` — 检查对齐

### docs/
8. `api-contract.md` — msg → message

### 不动
- `web/` — 暂不改
- `client/cocos-client/` — 暂不改
- `config/cards.json` — 数据源，不动
