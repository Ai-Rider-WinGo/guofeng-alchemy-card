# UI 按钮与交互控件生成 Prompt

## 使用场景

用于生成《国风炼金卡牌》的按钮、底部导航、弹窗控件、奖励入口、筛选标签等 UI 素材。该文件专门约束交互按钮风格，避免素材跑成普通网页按钮或现代扁平 UI。

## 主按钮 Prompt

```text
国风历史卡牌手游主操作按钮，深漆红底，青铜金外描边，暗金内描边，轻微浮雕，古籍纸纹，金石纹理，左右短云纹收尾，移动端竖屏游戏 UI，按钮文字区域清晰留白，适合“抽 10 次”按钮，premium Chinese historical card game interface, restrained low-saturation gold highlight, tactile, elegant, not flashy
```

## 抽卡按钮 Prompt

```text
Chinese historical card game gacha draw button, dark lacquer red and ink black base, bronze double border, subtle golden edge glow, ancient bamboo slip motif, refined embossed relief, mobile portrait game UI, large primary button for ten-pull draw, clear touch target, premium collectible card game style, no embedded text
```

## 次级按钮 Prompt

```text
国风历史卡牌手游次级按钮，宣纸浅底或半透明墨黑底，细青铜描边，竹简纹理，轻微阴影，适合“概率说明”“卡池详情”“返回”按钮，移动端游戏 UI，克制高雅，不要大面积发光
```

## 底部导航 Prompt

```text
国风历史卡牌手游底部导航栏，暗色木牍和青铜铭牌结构，五个功能 tab，首页 抽卡 合成 卡册 我的，选中态青铜金描边和顶部细金线，未选中低亮度线框，朱砂红点提示，mobile portrait game bottom navigation, premium collectible card UI, no modern web navbar
```

## 图标按钮 Prompt

```text
国风历史卡牌手游图标按钮，圆角方形，墨黑半透明底，青铜金边框，浅金线性图标，适合关闭 返回 设置 分享 帮助，移动端触控按钮，轻微浮雕，金石纹理，不使用 emoji，不使用现代彩色 icon
```

## 卡册筛选标签 Prompt

```text
国风历史卡牌手游筛选标签，竹简小标签，青铜细边，宣纸纹理，适合朝代筛选 类型筛选 稀有度筛选，选中态低饱和金色高光，未选中墨色低亮度，mobile game UI filter chip, not SaaS chip, not material design
```

## 负面 Prompt

```text
modern SaaS button, web button, HTML button, material design, flat UI, pill button, blue purple gradient, neon, cyberpunk, glassmorphism, plastic button, cheap casino style, over saturated red gold, fantasy magic circle, alchemy furnace, talisman, immortal cultivation, rune, cartoon cute, emoji icon, unreadable text, watermark, logo artifact
```

## 输出要求

- 生成按钮时尽量不要把中文文字烘焙进图片。
- 需要提供空按钮底图，文字由 Cocos / UI 层叠加。
- 每个按钮至少输出默认、按下、禁用、可领取/高亮四种状态。
- 推荐 2x 或 3x 分辨率导出，方便移动端缩放。
- 保留透明 PNG。

## 首批控件清单

- `button_primary_draw10_default`
- `button_primary_draw10_pressed`
- `button_primary_draw10_disabled`
- `button_secondary_draw1_default`
- `button_synthesis_default`
- `button_reward_claimable`
- `button_plain_probability`
- `icon_button_close`
- `tab_bottom_selected_draw`
- `tab_bottom_unselected`
- `badge_red_dot`
