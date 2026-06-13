# 国风炼金卡牌

抖音小游戏方向：以中国历史人物、历史事件、历史关系为核心的国风卡牌合成收集游戏。

项目基线以策划案为准：

- `策划案/国风炼金卡牌-项目整体策划案.md`

## 当前阶段

当前处于 MVP 前置整理阶段，目标是先验证：

抽卡 -> 库存 -> 同名升星 -> 历史关系合成 -> 图鉴解锁

旧的五行炼成 demo 与 4x4 合成状态机已废弃，不再作为产品方向依据。

## 目录

- `docs/mvp-scope.md`：第一版玩法验证范围
- `docs/data-model.md`：核心 JSON 数据模型说明
- `docs/next-steps.md`：后续开发顺序
- `docs/windows-comfyui-card-samples.md`：Windows + ComfyUI 首批样张需求
- `docs/card-asset-test-requirements.md`：素材生成新一轮测试需求
- `docs/card-copy.md`：卡牌内文字内容与画面关键词
- `docs/card-asset-test-results.md`：样张测试记录模板
- `docs/ui-interaction-style-guide.md`：按钮、底部导航、筛选、状态反馈的交互 UI 风格规范
- `config/cards.json`：MVP 样例卡牌母表
- `config/card_text_content.json`：卡面、详情页、图鉴文字内容
- `config/ui_style_tokens.json`：交互 UI 颜色、尺寸、状态 token
- `config/merge_rules.json`：MVP 合成规则
- `config/draw_pools.json`：MVP 抽卡池
- `config/daily_limits.json`：每日抽卡与奖励次数
- `assets-source/prompts/card-art-style.md`：卡牌原画提示词风格基线

## MVP 内容方向

第一条验证线采用“秦汉篇 / 楚汉战争”：

- 刘邦 + 纪信 -> 荥阳脱困
- 项羽 + 章邯 -> 巨鹿之战
- 荥阳脱困 + 鸿门宴 -> 楚汉相争
- 楚汉相争 + 垓下之围 -> 大汉开国

## 开发原则

- 先做小卡池、真闭环，再扩全量内容。
- 低级卡也必须是历史知识点，不作为纯材料。
- 合成时必须解释历史关系，而不是只给结果。
- 经济参数进入配置表，不写死在代码里。
- 终极编号卡、广告、支付、后台管理放到玩法验证之后。
- 图片生成不承担大段文字展示，卡牌文字由配置和 UI 叠加，避免 AI 乱码。
- 按钮和交互控件必须遵循游戏 UI 质感，不使用现代网页按钮或 SaaS 胶囊风。
