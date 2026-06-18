# 国风炼金卡牌 · 接口契约与联调标准

> **本文档为项目接口唯一权威源。** 前端(`web/`)、后端(`server/`)、数据库(`db/`)均以此文档为联调基准。
> 任何接口变更必须先在本文档更新，经 review 后同步到各模块实现。

---

## 1. 模块协作模型

```
docs/api-contract.md + config/*.json (设计/配置层)
    │
    ├──→ web/        读 config + 按 API 契约调接口
    ├──→ server/     按 API 契约实现接口 + 读 config 做业务逻辑
    └──→ db/         按 Schema 建表，字段名与 API 响应一致
```

**同步规则**：
- `config/*.json` 玩法数据变更 → `web/` 和 `server/` 同步适配
- `docs/api-contract.md` 接口变更 → 三个模块同时更新对应实现
- `db/` 字段与 API 响应的 JSON key 保持一致（`card_id` 而非 `cardId`）

---

## 2. API 通用规范

### 2.1 基础约定

| 项目 | 约定 |
|---|---|
| 协议 | HTTPS |
| Base URL | `https://api.guofeng-alchemy.example.com/v1` |
| 请求格式 | `Content-Type: application/json` |
| 响应格式 | `{ "code": 0, "data": {...}, "message": "ok" }` |
| 认证 | Header `Authorization: Bearer {token}` |
| 分页 | `?page=1&page_size=20`，响应含 `total`/`page`/`page_size` |
| 时间格式 | ISO 8601: `2026-06-16T10:30:00+08:00` |

### 2.2 统一响应结构

```json
// 成功
{ "code": 0, "data": { ... }, "message": "ok" }

// 业务错误
{ "code": 40001, "data": null, "message": "抽卡券不足" }

// 系统错误
{ "code": 50000, "data": null, "message": "服务器内部错误" }
```

### 2.3 错误码

| 范围 | 含义 |
|---|---|
| 0 | 成功 |
| 40001-40099 | 业务错误（券不足/次数用完/材料不够…） |
| 40100-40199 | 认证错误（未登录/Token过期） |
| 40300-40399 | 权限错误（非管理员操作后台接口） |
| 40400-40499 | 资源不存在 |
| 50000-50099 | 服务端错误 |

### 2.4 命名规范

| 层 | 规范 | 示例 |
|---|---|---|
| URL path | kebab-case | `/draw-pools/weekly` |
| JSON key | snake_case | `card_id`, `dynasty_tag` |
| DB 字段 | snake_case | `card_id`, `draw_count` |
| TS 类型 | PascalCase interface | `CardData`, `DrawResult` |

> JSON key 与 DB 字段名保持一致，方便后端直接映射，前端无需额外转换。

---

## 3. 共享类型定义

以下类型在 `frontend`（TS interface）、`backend`（DTO/Model）、`database`（column）三层保持一致。

```typescript
// === 卡牌 ===
interface CardData {
  card_id: string;            // "liubang_002"
  name: string;               // "刘邦"
  level: number;              // 2
  type: CardType;             // "person"
  dynasty: string;            // "秦汉"
  dynasty_tag: DynastyTag;    // "qin_han"
  rarity: Rarity;             // "R"
  tags: string[];             // ["楚汉", "开国", "帝王"]
  short_desc: string;
  story: string;
  knowledge_point: string;
  related_cards: string[];    // ["jixin_002", ...]
  merge_paths: MergePath[];
  star_max: number;           // 3
  image_url: string;          // CDN URL
  thumbnail_url: string;      // CDN URL
  is_final: boolean;
  final_desc?: string;
}

type CardType = "person" | "event" | "weapon" | "book" | "place" | "dynasty";
type Rarity = "N" | "R" | "SR" | "SSR" | "UR";
type DynastyTag = "qin_han" | "tang" | "song" | "ming" | "three_kingdoms" | "spring_autumn_warring_states";

interface MergePath {
  target: string;      // 目标卡 card_id
  partner: string;     // 需要的搭档卡 card_id
  desc: string;        // 合成描述
}

// === 卡池 ===
interface DrawPool {
  pool_id: string;           // "weekly_qinhan"
  name: string;              // "周期朝代池·秦汉风云"
  pool_type: "permanent" | "weekly_dynasty" | "limited_premium";
  dynasty_tag?: DynastyTag;
  rarity_weights: Record<Rarity, number>;
  featured_card_ids: string[];
  pity_config: PityConfig;
  ticket_type: "normal_ticket" | "premium_ticket";
  active: boolean;
  rotation_week?: number;
  duration_days: number;
  collection_target: number;
  schedule_note?: string;
}

interface PityConfig {
  sr_every: number;          // 10
  ssr_every: number;         // 70
  ssr_hard_pity: number;     // 140
  description: string;
}

// === 抽卡 ===
interface DrawRequest {
  pool_id: string;           // 卡池 ID
  count: 1 | 10;             // 单抽或十连
  ticket_type: "normal_ticket" | "premium_ticket";
}

interface DrawResult {
  cards: DrawnCard[];
  pity_info: PityInfo;
  tickets_remaining: number;
}

interface DrawnCard {
  card: CardData;
  is_new: boolean;
  rarity_effect: Rarity;     // 触发亮度的稀有度光效等级
}

interface PityInfo {
  current_count: number;     // 当前保底计数
  sr_pity: number;           // 距离保底 SR 剩余抽数
  ssr_pity: number;          // 距离保底 SSR 剩余抽数
}

// === 用户库存 ===
interface UserCard {
  card_id: string;
  quantity: number;
  star_level: number;        // 1-5
  obtained_at: string;       // ISO 8601
}

// === 合成 ===
interface MergeRequest {
  recipe_id: string;         // merge rule id，如 "merge_xingyang_escape"
}

interface MergeResult {
  success: boolean;
  output_card?: CardData;    // 合成产出的卡
  consumed: boolean;         // 是否消耗了输入卡
  new_card: boolean;         // 是否首次获得
}

// === 碎片合成 ===
interface ShardSynthesizeRequest {
  card_id: string;           // 要合成的目标卡
}

// === 重复卡转化 ===
interface DuplicateConvertRequest {
  card_id: string;
  action: "star_up" | "decompose" | "auto";
}

interface DuplicateConvertResult {
  action_taken: "star_up" | "decompose";
  star_level?: number;       // 升星后星级
  shards_gained?: {
    shard_type: string;
    quantity: number;
  };
}

// === 收集 ===
interface CollectionProgress {
  dynasty_tag: DynastyTag;
  collected_count: number;
  total_count: number;
  cards: string[];           // 已收集的 card_id 列表
  rewards_claimed: number[]; // 已领取的奖励档位 required_count
}
```

---

## 4. API 端点清单

### 4.1 用户认证

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/auth/login` | 登录/注册（抖音 UID + Token） |
| POST | `/auth/guest` | 游客注册 |
| GET | `/auth/me` | 获取当前用户信息 |

**POST /auth/login**
```json
// Request
{ "platform_uid": "douyin_xxx", "platform_token": "yyy" }
// Response
{ "code": 0, "data": { "token": "jwt...", "user": { "uid": "...", "nickname": "..." } } }
```

### 4.2 卡牌数据

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/cards` | 获取全部卡牌定义（分页） |
| GET | `/cards/:card_id` | 获取单张卡牌详情 |
| GET | `/cards?dynasty=qin_han` | 按朝代筛选 |

### 4.3 卡池

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/pools` | 获取所有卡池 |
| GET | `/pools/active` | 获取当前激活的卡池 |
| GET | `/pools/:pool_id` | 卡池详情（含概率公示） |

### 4.4 抽卡

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/draw` | 执行抽卡 |
| GET | `/draw/history?page=1` | 抽卡历史 |
| GET | `/draw/pity/:pool_id` | 查询保底计数 |

**POST /draw**
```json
// Request
{ "pool_id": "weekly_qinhan", "count": 10, "ticket_type": "normal_ticket" }
// Response — 逐张返回，十连最后一张保底 SR+
{ "code": 0, "data": { "cards": [...], "pity_info": {...}, "tickets_remaining": 5 } }
```

### 4.5 库存

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/inventory` | 我的卡牌库存 |
| GET | `/inventory/fragments` | 我的碎片数量 |
| GET | `/inventory/currency` | 我的货币余额（金币/券/钻石） |

### 4.6 合成

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/merge/recipe` | 配方合成（指定 merge rule） |
| POST | `/merge/shard-synthesize` | 碎片合成 |
| POST | `/merge/fuse` | 等级熔合（批量低阶卡） |
| POST | `/merge/star-up` | 重复卡升星 |
| POST | `/merge/decompose` | 手动分解卡牌 |
| GET | `/merge/available` | 当前可执行的合成列表 |

**POST /merge/recipe**
```json
// Request
{ "recipe_id": "merge_xingyang_escape" }
// Response — 配方合成不消耗输入卡
{ "code": 0, "data": { "success": true, "output_card": {...}, "consumed": false, "new_card": true } }
```

### 4.7 收集/图鉴

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/collection` | 总收集进度 |
| GET | `/collection/:dynasty_tag` | 某朝代收集详情 |
| POST | `/collection/claim-reward` | 领取收集奖励 |

### 4.8 任务与签到

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/tasks/daily` | 今日任务及进度 |
| GET | `/tasks/weekly` | 本周任务及进度 |
| POST | `/tasks/claim/:task_id` | 领取任务奖励 |
| POST | `/signin` | 签到 |
| GET | `/signin/status` | 签到状态（连续天数/今日是否已签） |

### 4.9 商店

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/shop/items` | 可兑换商品列表 |
| POST | `/shop/exchange` | 兑换商品 |

### 4.10 后台管理（Admin 分支专用，需 admin 权限）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/admin/users` | 用户列表 |
| PUT | `/admin/users/:uid` | 编辑用户（VIP/封禁） |
| GET | `/admin/cards` | 卡牌管理列表 |
| POST | `/admin/cards` | 新增卡牌 |
| PUT | `/admin/cards/:card_id` | 编辑卡牌 |
| DELETE | `/admin/cards/:card_id` | 下架卡牌 |
| PUT | `/admin/pools/:pool_id` | 修改卡池配置 |
| POST | `/admin/pools/schedule` | 创建卡池排期 |
| GET | `/admin/analytics/overview` | 运营数据概览 |
| GET | `/admin/analytics/draw-stats` | 抽卡统计 |

---

## 5. 数据库字段映射

接口响应 JSON key 与数据库字段名一致，后端直接做 ORM 映射，无需转换层。

| JSON key | DB column | 类型 | 说明 |
|---|---|---|---|
| `card_id` | `cards.card_id` | VARCHAR(32) | 卡牌唯一标识 |
| `name` | `cards.name` | VARCHAR(100) | 卡牌名称 |
| `rarity` | `cards.rarity` | VARCHAR(8) | N/R/SR/SSR/UR |
| `dynasty_tag` | `cards.dynasty_tag` | VARCHAR(32) | 朝代标签 |
| `image_url` | `cards.image_url` | TEXT | CDN 图片 URL |
| `thumbnail_url` | `cards.thumbnail_url` | TEXT | CDN 缩略图 URL |
| `tags` | `cards.tags` | JSONB | 标签数组 |
| `merge_paths` | `cards.merge_paths` | JSONB | 合成路径数组 |
| `pool_id` | `draw_pools.pool_id` | VARCHAR(32) | 卡池 ID |
| `rarity_weights` | `draw_pools.rarity_weights` | JSONB | 概率权重 |
| `pity_config` | `draw_pools.pity_config` | JSONB | 保底配置 |
| `draw_count` | `user_pity_counters.draw_count` | INT | 保底计数 |

---

## 6. Config JSON 流通路径

```
design/config/
    │
    ├──→ backend 启动时加载 config JSON → 内存缓存
    │       │
    │       ├── draw_pools.json  → 抽卡概率计算
    │       ├── merge_rules.json → 合成规则校验
    │       └── cards.json       → 返回给前端 /cards API
    │
    └──→ frontend 编译时 copy config JSON → web/config/
            │
            ├── 离线展示用（图鉴/合成预览）
            └── 运行时以 API 返回数据为准
```

> **原则**：前端本地 config 仅作离线参考，所有实时业务数据（概率/库存/收集进度）必须以 API 返回为准。

---

## 7. 联调检查清单

前后端联调前，双方各自对照此清单：

### 前端自查
- [ ] 所有 API 调用使用统一封装的 `fetch` / `axios` 实例
- [ ] Base URL 通过环境变量注入（开发指向 localhost，生产指向正式 API）
- [ ] 所有返回数据以 API 为准，不依赖本地 config 计算结果
- [ ] 抽卡结果/合成结果/库存变更后刷新对应状态
- [ ] 错误码统一处理，401 时跳转登录

### 后端自查
- [ ] 所有接口返回格式符合 `{ code, data, msg }` 规范
- [ ] JSON key 使用 snake_case，与 DB 字段一致
- [ ] 保底计数器按 pool 独立维护
- [ ] 概率计算以 `design/config/draw_pools.json` 为准
- [ ] Admin 接口做权限校验（非 admin 返回 403）

### 数据库自查
- [ ] 表结构与 `db/migrations/001_initial_schema.sql` 一致
- [ ] JSON key 与 API 响应一致（snake_case）
- [ ] image_url/thumbnail_url 存 CDN URL，不存二进制
- [ ] 索引覆盖高频查询（`user_cards(user_id)`, `draw_history(user_id, drew_at)`）
