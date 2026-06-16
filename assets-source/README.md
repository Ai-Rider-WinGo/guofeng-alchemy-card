# 素材资产存储方案

> 卡牌图片、卡背、UI 素材等大型二进制文件的存储与分发策略。

## 方案：对象存储 + CDN

所有图片素材不上传 git 仓库，存储于对象存储服务（OSS/COS/S3），通过 CDN 加速分发。

### 为什么不用 git

| 问题 | 说明 |
|---|---|
| 仓库膨胀 | 数百张 1080p 卡面图 × 每张 200KB-2MB = 数百 MB，随卡牌增长持续膨胀 |
| clone 缓慢 | 团队成员/CI 每次 clone 都要拉取全部历史图片 |
| diff 无用 | 图片的 git diff 无意义，占空间且不可读 |
| 协作冲突 | 二进制文件无法合并，多人同时更新图片易冲突 |

### CDN 路径规范

```
{CDN_BASE}/
├── cards/
│   ├── qin_han/          # 秦汉卡牌
│   │   ├── liubang_002.png
│   │   ├── liubang_002_thumb.png
│   │   └── ...
│   ├── tang/             # 唐朝卡牌
│   ├── song/             # 宋朝卡牌
│   ├── ming/             # 明朝卡牌
│   ├── three_kingdoms/   # 三国卡牌
│   └── spring_autumn/    # 春秋战国卡牌
├── cardbacks/            # 卡背图案
│   ├── default.png
│   ├── qin_han_001.png   # 秦汉限定卡背
│   └── ...
├── frames/               # 卡框（按稀有度）
│   ├── N_frame.png
│   ├── R_frame.png
│   ├── SR_frame.png
│   ├── SSR_frame.png
│   └── UR_frame.png
├── ui/                   # UI 素材
│   ├── bg_home.png
│   ├── bg_draw.png
│   ├── icon_coin.png
│   └── ...
└── effects/              # 特效素材
    ├── draw_N.webp       # N 卡抽卡光效
    ├── draw_SSR.webp     # SSR 抽卡光效
    └── ...
```

### 环境 CDN_BASE 配置

| 环境 | CDN_BASE | 说明 |
|---|---|---|
| 本地开发 | `/mock-assets` 或 `http://localhost:3000/public` | 用少量占位图 |
| 测试环境 | `https://test-cdn.guofeng-alchemy.example.com` | 测试用 OSS bucket |
| 生产环境 | `https://cdn.guofeng-alchemy.example.com` | 生产 OSS + CDN |

> `{CDN_BASE}` 在 `cards.json` 等配置文件中作为模板变量，运行时由环境变量注入。

### 图片规格

| 类型 | 分辨率 | 格式 | 大小上限 |
|---|---|---|---|
| 卡面原图 | 1080×1560 | PNG (无损) | 2MB |
| 卡面缩略图 | 270×390 | WebP | 100KB |
| 卡背 | 1080×1560 | PNG | 1MB |
| 卡框 | 1080×1560 | PNG (透明) | 500KB |
| UI 素材 | 按设计稿 | PNG/WebP | 200KB |
| 特效 | 按设计稿 | WebP/APNG | 500KB |

### 上传流程

1. **AI 出图 / 设计师交付** → 原图 (PSD/PNG)
2. **质检筛选** → 确认通过
3. **批量处理**：
   - 重命名为 `{card_id}.png`
   - 生成缩略图 `{card_id}_thumb.png`（270×390）
   - 压缩优化（pngquant / sharp）
4. **上传 OSS** → 按 `{dynasty_tag}/` 分目录
5. **CDN 刷新** → 新文件即时生效
6. **更新 cards.json** → 确认 `image`/`thumbnail` 路径正确（CDN URL 已在配置中，此步通常无需改）

### 当前 MVP 阶段

MVP 阶段卡牌数量少（12张秦汉篇），暂用前端本地 `public/` 目录存放占位图，后续迁移到 OSS。

```text
web/public/art/          ← 临时存放，后续迁至 CDN
```

### 相关文件

- `config/cards.json` — 卡牌数据中的 `image` 和 `thumbnail` 字段引用 CDN URL
- `assets-source/prompts/card-art-style.md` — AI 出图 prompt 基线（该文件存于 git）
