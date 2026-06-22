# 数据模型统一映射 (data-map)

> 阶段 0 产出。确立**后端 `cards` 表为唯一权威卡牌数据源**,前端 `web/` 与未来玩家运行时 API 均对齐此 schema。
> 最后更新:2026-06-19

## 1. 权威性声明

| 数据 | 权威源 | 说明 |
|---|---|---|
| **卡牌 (cards)** | **后端 `cards` 表** (149 张,秦汉篇) | 由 `server/src/seed/seed.ts` 从 `import_cards.json` + `config/cards.json` 导入 |
| 抽卡池 (draw_pools) | 后端 `draw_pools` 表 (8 个池) | seed 从 `config/draw_pools.json` 导入 |
| 合成规则 (merge_rules) | 后端 `merge_rules` 表 (16 条) | seed 从 `config/merge_rules.json` 导入 |
| 玩法配置 | 后端 `game_configs` 表 | daily_limits / duplicate_rules / dynasties / rewards |
| 前端 `config/cards/*.json` | **已废弃**(仅 qinhan.json 有 12 张,其余为空) | 前端改为从 `/api/public/*` 拉取 |

> 前端原有 `config/cards.json`(12 张)是后端 149 张的子集,**不再作为数据源**。

---

## 2. 卡牌字段映射 (后端 Card ↔ 前端 web Card)

### 后端权威字段 (`cards` 表,见 `server/src/database/entities/card.entity.ts`)
```
id, card_id(unique), name, rarity, dynasty, dynasty_tag, level,
type, short_desc, story, knowledge_point, tags[], related_cards[],
merge_paths[], star_max, image_url, thumbnail_url, is_active,
created_at, updated_at
```

### 前端适配层(阶段 7 在 `lib/types.ts` 调整)

前端 `Card` 接口改为以后端字段为准,`quality` 由 `level` 派生(纯函数,无数据冗余):

| 后端字段 | 前端字段 | 适配说明 |
|---|---|---|
| `card_id` | `id` | 前端原用 `id`,统一改为 `card_id`(或 alias) |
| `rarity` | `rarity` | 直接用后端值 |
| `dynasty` | `dynasty` | 展示用中文名(秦汉),直接用 |
| `dynasty_tag` | `dynasty`(枚举) | 见 §3,前端 DynastyId 需映射 |
| `level` | `level` | 直接用 (1-5,策划案设计 1-12) |
| `type` | `type` | 见 §4 枚举映射 |
| `story` / `knowledge_point` / `short_desc` | 同名 | 直接用 |
| `tags` / `related_cards` / `merge_paths` | 同名 | 直接用 |
| `image_url` / `thumbnail_url` | `image` / `thumbnail` | 前端别名 |
| — (派生) | `quality` | 由 `getQualityByLevel(level)` 派生,见 §5 |

---

## 3. 朝代映射 (dynasty_tag ↔ DynastyId)

前端 `DYNASTY_IDS` 用驼峰,后端 `dynasty_tag` 用下划线。**统一规则:API 层做转换,前端内部仍用 `DYNASTY_IDS` 驼峰**。

| 后端 dynasty_tag | 前端 DynastyId | 中文名 | 状态 |
|---|---|---|---|
| `qin_han` | `qinhan` | 秦汉 | ✅ 后端有 149 张卡 |
| `three_kingdoms` | `sanguo` | 三国 | ⏳ 后端无卡(待补) |
| `tang` | `tang` | 唐 | ⏳ 后端无卡 |
| `song` | `song` | 宋 | ⏳ 后端无卡 |
| `ming` | `ming` | 明 | ⏳ 后端无卡 |
| `spring_autumn_warring_states` | `chunqiu` | 春秋战国 | ⏳ 后端无卡 |

> 后端 seed 的 `dynastyTagMap`(`seed.ts:44-48`)已含完整映射,前端 API 客户端层做 `qin_han↔qinhan` 转换。

---

## 4. 卡牌类型映射 (type 枚举)

| 后端 CardType | 前端 CardType | 中文 |
|---|---|---|
| `person` | `person` | 人物 |
| `event` | `event` | 事件 |
| `place` | `place` | 地点 |
| `weapon` | `artifact` | 兵器 |
| `classic` | `strategy` | 典籍 |
| `dynasty` | `strategy` | 朝代(归并入 strategy) |

> 后端 149 张卡 type 分布:place 50 / person 46 / event 30 / weapon 12 / classic 9 / dynasty 2。
> 前端枚举更少,`weapon→artifact`、`classic/dynasty→strategy` 在 API 适配层归并。

---

## 5. 品质 ↔ 稀有度 ↔ 等级 三维关系

三套体系并非独立,而是对同一"卡牌价值"的不同刻度。**前端 `quality` 纯由 `level` 派生**,不再存储:

```
level 1-2   → quality=common(凡品)   ↔ rarity=N
level 3-5   → quality=fine(精良)     ↔ rarity=N/R
level 6-7   → quality=rare(稀有)     ↔ rarity=R/SR
level 8-9   → quality=epic(极品)     ↔ rarity=SR/SSR
level 10-11 → quality=divine(神品)   ↔ rarity=SSR/UR
level 12    → quality=treasure(至宝) ↔ rarity=UR
```

- `getQualityByLevel(level)`(`web/lib/types.ts:15-20`):**保留**,纯函数派生。
- `rarity`(N/R/SR/SSR/UR):后端权威字段,用于抽卡权重、图鉴筛选。
- seed 的 `qualityToRarity`(`seed.ts:33-39`)用于历史导入,后续不再需要。

> **注意**:后端当前卡 level 范围仅 1-5(MVP),故实际 rarity 集中在 N(54)/R(51)/SR(32),SSR(8)/UR(4) 为高级别卡。策划案设计的 12 级金字塔体系(`web/lib/constants.ts:6-19`)是完整目标,后端卡牌数据需逐步补齐。

---

## 6. 抽卡池字段映射 (DrawPool)

| 后端 DrawPool 字段 | 前端 DrawPool 字段 | 说明 |
|---|---|---|
| `pool_id` | `pool_id` | 直接用 |
| `name` | `name` | 直接用 |
| `type`(permanent/weekly_dynasty/limited_premium) | `pool_type` | 前端用 pool_type |
| `rarity_weights` `{N:60,R:25,...}` | `rarity_weights` | **统一用后端格式**(前端原 `levelWeights/qualityWeights` 废弃) |
| `featured_card_ids` | `active_card_ids` | 精选/激活卡列表 |
| `dynasty_tag` | `dynasty` | 朝代号 |
| `pity_config` | (新增) | 保底配置 |
| `rotation_schedule` | (新增) | 周期轮换 |

> 前端 `cardUtils.ts` 的 `loadDrawPools()` 当前**硬编码**返回一个池(`cardUtils.ts:58-78`),阶段 7 改为从 `/api/public/pools` 拉取。

---

## 7. 实施影响清单

| 影响点 | 阶段 | 动作 |
|---|---|---|
| `web/lib/types.ts` Card 接口 | 阶段 7 | 对齐后端字段,quality 改派生 |
| `web/lib/cardUtils.ts` loadDrawPools | 阶段 7 | 改为 API 拉取,废弃硬编码 |
| `web/lib/config-loader.ts` | 阶段 7 | 改为 API 拉取 |
| `web/lib/synthesis-engine.ts` | 阶段 8 | 合成逻辑迁后端,前端仅调 API |
| 后端 `seed.ts` | (无需改) | 已是权威导入源 |
| 后端 cards 表 | (无需改) | 已是权威数据 |

---

## 8. 后续数据补齐(MVP 之后)

- 后端目前只有秦汉 149 张卡(level 1-5),其余 5 朝代 + level 6-12 待补。
- 补卡时统一走 seed 流程,保证 cards 表持续作为唯一权威源。
