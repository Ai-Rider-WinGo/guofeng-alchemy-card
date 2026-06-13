# Contributing

感谢关注《国风炼金卡牌》。本项目当前处于 MVP Pre-Alpha 阶段，贡献重点是让产品方向、配置数据、Cocos 客户端和素材管线保持一致。

## 工作原则

- 任何玩法改动都应先确认是否符合“国风历史卡牌收集游戏”的定位。
- 不把项目改写成修仙、炼丹、洞府或泛玄学模拟器。
- 所有概率、奖励、卡池、合成和每日限制优先进入配置文件。
- 卡牌内容应锚定中国历史人物、历史事件、兵器、典籍、制度或朝代文化。
- UI 和动效可以使用“古籍炼炉”作为合成意象，但主流程仍是抽卡、合成、收集、升星和卡册。

## 分支建议

```text
feature/{short-name}
fix/{short-name}
docs/{short-name}
content/{short-name}
art/{short-name}
```

示例：

```text
feature/draw-result-page
content/qinhan-card-expansion
docs/backend-service-plan
```

## 提交内容建议

### 产品与文档

- 更新 `README.md`、`docs/` 或 `策划案/`。
- 说明改动影响的玩法闭环、术语或范围。
- 如果新增系统，补充到 `docs/roadmap.md` 或 `docs/architecture.md`。

### 配置与内容

- 更新 `config/*.json`。
- 保持字段命名稳定。
- 新增卡牌时补齐 `short_desc`、`story`、`knowledge_point`、`related_cards`、`merge_hint`。
- 新增卡池时说明 `pool_type`、`dynasty_tag`、`featured_card_ids` 和概率权重。

### Cocos 客户端

- 代码位于 `client/cocos-client/assets/scripts/`。
- 优先复用现有 managers 与 data types。
- 页面逻辑不要直接硬编码卡池概率、奖励或内容文本。
- 本地 JSON mock 应与根目录 `config/` 保持一致。

### 素材与 AI 出图

- prompt 基线位于 `assets-source/prompts/`。
- 素材文件应遵循命名规范。
- 卡牌图、缩略图、卡背、稀有度边框、Banner 应明确用途。
- 暂不提交未经筛选的大量生成中间图。

## Pull Request 检查

提交 PR 前请确认：

- 方向没有偏离历史卡牌收集。
- 新增配置可以被现有或规划中的客户端读取。
- README 或 docs 已同步关键变化。
- 没有提交 `library/`、`temp/`、`local/`、`build/` 等 Cocos 生成目录。
- 没有提交 `.env`、密钥、平台账号或私有素材源文件。

## Issue 分类

- `feature`：玩法、页面、系统能力。
- `bug`：客户端、配置、流程或文档错误。
- `content`：卡牌、朝代池、历史关系、文本内容。
- `art`：卡牌图、卡背、UI、动效、素材管线。
- `docs`：README、架构、路线图、技术文档。
