# Cocos 前端结构规划

## 当前工程

Cocos Creator 工程位于：

`client/cocos-client`

编辑器版本：

`Cocos Creator 3.8.8`

项目模板：

`Empty(2D)`

发布目标：

`抖音小游戏`

## 前端定位

前端不以炼炉、洞府、玄学场景为中心，而采用标准竖屏国风卡牌手游结构。

底部导航：

首页 / 抽卡 / 合成 / 卡册 / 我的

## MVP 页面

1. 首页
2. 抽卡页
3. 抽卡结果页
4. 合成页
5. 卡册页
6. 卡牌详情页
7. 任务页
8. 我的页面

## 页面重点

### 首页

- 当前周期卡池 Banner
- 当前主题，例如“三国名将卡池”
- 主推卡牌，例如诸葛亮、赵云、关羽
- 抽卡入口
- 合成入口
- 卡册收集进度
- 今日任务

### 抽卡页

- 当前卡池主题
- 卡池剩余时间
- 主推卡牌展示
- 抽 1 次
- 抽 10 次
- 当前拥有抽卡券数量
- 概率说明
- 卡池详情

### 抽卡结果页

- 国风卡包开启
- 卷轴展开
- 水墨扩散
- 卡背飞出
- 卡牌翻转
- 稀有度光效爆发

抽卡表现不要使用炼丹炉、符咒、修仙炉火作为核心视觉。

### 合成页

- 碎片合成
- 重复卡升星
- 低阶卡熔合
- 可合成列表
- 碎片进度条
- 一键合成入口

### 卡册页

- 总收集进度
- 按朝代筛选
- 按类型筛选：人物、事件、兵器、典籍
- 已收集亮起
- 未收集显示剪影
- 每个朝代有独立图鉴奖励

## 脚本模块

建议在 `assets/scripts/` 下组织：

- `core/ConfigLoader.ts`：读取本地 JSON 配置
- `core/EventBus.ts`：页面间事件
- `data/CardTypes.ts`：卡牌、库存、合成规则、卡池类型
- `managers/CardManager.ts`：卡牌目录缓存与查询
- `managers/InventoryManager.ts`：本地库存状态
- `managers/DrawManager.ts`：抽卡逻辑
- `managers/PoolRotationManager.ts`：周期朝代卡池状态
- `managers/DuplicateConversionManager.ts`：重复卡转化
- `managers/SynthesisManager.ts`：碎片合成与低阶卡熔合
- `managers/StarManager.ts`：重复卡升星
- `managers/CollectionManager.ts`：卡册解锁状态
- `managers/WeeklyRewardManager.ts`：周期收集奖励
- `ui/AppRoot.ts`：主入口与页面切换
- `ui/pages/HomePage.ts`：首页
- `ui/pages/DrawPage.ts`：抽卡页
- `ui/pages/DrawResultPage.ts`：抽卡结果页
- `ui/pages/SynthesisPage.ts`：合成页
- `ui/pages/CollectionPage.ts`：卡册页
- `ui/pages/CardDetailPage.ts`：卡牌详情页
- `ui/pages/TaskPage.ts`：任务页
- `ui/pages/ProfilePage.ts`：我的页面
- `ui/components/CardView.ts`：卡牌展示组件
- `ui/components/PoolBanner.ts`：卡池 Banner 组件
- `ui/components/CollectionProgress.ts`：卡册进度组件
- `ui/components/ResourceBar.ts`：资源栏组件

## 数据接入

MVP 阶段先从仓库根目录的配置表同步/复制到 Cocos `assets/resources/config/`：

- `config/cards.json`
- `config/draw_pools.json`
- `config/merge_rules.json`
- `config/daily_limits.json`

后续新增：

- `config/duplicate_conversion_rules.json`
- `config/weekly_collection_rewards.json`
- `config/dynasty_tags.json`

等后端接入后，再由 `ApiClient` 调用 Node.js + TypeScript 后端接口，Cocos 本地 JSON 作为开发 mock。

## Git 管理规则

外层 GitHub 仓库统一管理整个项目。Cocos 工程自己生成的嵌套 `.git` 已删除。

需要进入 Git：

- `client/cocos-client/assets/`
- `client/cocos-client/settings/`
- `client/cocos-client/package.json`
- `client/cocos-client/tsconfig.json`
- `client/cocos-client/.creator/`
- `client/cocos-client/.gitignore`

不进入 Git：

- `client/cocos-client/library/`
- `client/cocos-client/temp/`
- `client/cocos-client/local/`
- `client/cocos-client/build/`
- `client/cocos-client/native/`
- `client/cocos-client/profiles/`
