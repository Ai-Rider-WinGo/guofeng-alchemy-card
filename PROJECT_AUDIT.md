# PROJECT_AUDIT

审计时间：2026-06-22  
最近复核：2026-06-22  
审计范围：`web`、`server`、`admin-light`、数据库初始化、API 实际联调、Web -> Server -> Database 链路  
审计原则：验证代码质量、联调状态、运行状态；不修改业务代码。

## Executive Summary

当前项目已经具备 Early Alpha 的核心玩法闭环雏形：账号注册登录、抽卡、库存查询、合成、图鉴查询、签到接口在 `server` 源码运行模式下可以实际打通，`web` 开发模式也可以通过 Next.js rewrite 调用后端并读取数据库数据。

2026-06-22 复核后，以下 P0 已关闭：

- `web build`：RESOLVED，`npm run build` 成功，TypeScript 阶段通过。
- `server dist/main` 启动失败：RESOLVED，`npm run build` 成功，`npm run start:prod` 可启动并响应 API。

项目仍不具备生产发布条件，主要阻塞点包括：

- lint 脚本已恢复，但仍存在 warnings 债务，尚未形成零 warning 质量门禁。
- 数据库依赖 `synchronize: true`，生产迁移体系未建立。
- 种子数据存在朝代/标签严重不一致，已影响合成结果正确性。
- Douyin 登录仍为 Stub，H5/抖音小游戏适配还没有真实平台链路。

## Re-Audit Command Results

2026-06-22 复核命令结果：

| 检查项 | 命令 | 结果 |
| --- | --- | --- |
| web build | `cd web && npm run build` | PASS |
| web TypeScript | `cd web && npx tsc --noEmit` | PASS |
| server build | `cd server && npm run build` | PASS |
| server TypeScript | `cd server && npx tsc --noEmit` | PASS |
| server start:prod | `cd server && DATABASE_TYPE=sqlite DATABASE_URL=/private/tmp/guofeng_reaudit.sqlite JWT_SECRET=audit-secret PORT=3105 npm run start:prod` | PASS |
| server dist API | `GET /api/public/bootstrap` | PASS / 200 |
| server dist API | `POST /api/game/auth/register` | PASS / 201 |
| server dist API | `GET /api/game/auth/profile` | PASS / 200 |
| server dist API | `GET /api/game/draw/remaining` | PASS / 200 |
| admin-light build | `cd admin-light && npm run build` | PASS with warnings |
| web lint | `cd web && npm run lint` | PASS with warnings / 0 errors, 18 warnings |
| server lint | `cd server && npm run lint` | PASS with warnings / 0 errors, 38 warnings |
| admin-light lint | `cd admin-light && npm run lint` | PASS with warnings / 0 errors, 568 warnings |
| database seed | `cd server && DATABASE_TYPE=sqlite DATABASE_URL=/private/tmp/guofeng_reaudit_seed.sqlite JWT_SECRET=audit-secret npm run seed` | PASS |

## 1. 构建状态

### web build

命令：

```bash
cd web
npm run build
```

结果：RESOLVED / 成功

输出摘要：

- Next.js 编译阶段成功。
- TypeScript 校验阶段成功。
- 静态页面生成成功：13/13。

复核输出摘要：

```text
✓ Compiled successfully in 2.1s
Running TypeScript ...
Finished TypeScript in 1857ms
✓ Generating static pages using 11 workers (13/13)
```

结论：`web` 当前可以完成生产构建。

### server build

命令：

```bash
cd server
npm run build
```

结果：RESOLVED / 构建成功，构建产物可启动

构建输出：

```text
tsc -p tsconfig.json
```

产物启动验证：

```bash
DATABASE_TYPE=sqlite DATABASE_URL=/private/tmp/guofeng_reaudit.sqlite JWT_SECRET=audit-secret PORT=3105 npm run start:prod
```

复核输出摘要：

```text
Nest application successfully started
Server running on http://localhost:3105
Swagger docs: http://localhost:3105/api/docs
```

接口验证：

```text
GET /api/public/bootstrap: 200
POST /api/game/auth/register: 201
GET /api/game/auth/profile: 200
GET /api/game/draw/remaining: 200
```

结论：`server` 编译产物当前可以作为生产服务启动，原 `Cannot find module './dto/create-merge-rule.dto'` 已关闭。

### admin-light build

命令：

```bash
cd admin-light
npm run build
```

结果：成功，有警告

警告：

```text
The CJS build of Vite's Node API is deprecated.
Some chunks are larger than 500 kB after minification.
dist/assets/index-xkDyoIpY.js 1,538.28 kB / gzip 475.25 kB
```

结论：`admin-light` 可以完成构建，但需要后续做包体拆分和依赖优化。

## 2. 类型检查

### web TypeScript Check

命令：

```bash
cd web
npx tsc --noEmit
```

结果：RESOLVED / 成功

已关闭错误：

```text
app/draw/page.tsx(59,53): TS2352 fallback Card missing mergeHint
app/draw/page.tsx(95,53): TS2352 fallback Card missing mergeHint
lib/storage.test.ts(79,5): TS2322 GameState not assignable to narrowed object type
lib/storage.test.ts(84,5): TS2322 GameState not assignable to narrowed object type
lib/storage.test.ts(125,5): TS2322 currentWeeklyDynasty union not assignable to literal "qinhan"
lib/storage.test.ts(130,5): TS2322 currentWeeklyDynasty union not assignable to literal "chunqiu"
```

Warning：无 TypeScript warning 输出。

结论：`web` 独立 TypeScript check 当前通过，未关闭类型检查，未使用 `any` 绕过。

### server TypeScript Check

命令：

```bash
cd server
npx tsc --noEmit
```

结果：成功

Error：0  
Warning：0

复核结论：`dist/main` 已可启动，原运行时模块缺失问题已关闭。

### admin-light TypeScript Check

结果：未配置独立 TypeScript check。

说明：

- `admin-light` 当前以 Vue + JavaScript 为主。
- `package.json` 未提供 `typecheck` 或等价脚本。
- 只能通过 `npm run build` 间接验证打包。

## 3. Lint 检查

2026-06-22 已补齐 lint 配置：

- `web/package.json`：`lint`、`lint:fix`
- `web/eslint.config.mjs`
- `server/package.json`：`lint`、`lint:fix`
- `server/eslint.config.mjs`
- `admin-light/package.json`：`lint`、`lint:fix`
- `admin-light/eslint.config.mjs`

### web lint

命令：

```bash
cd web
npm run lint
```

结果：PASS with warnings

配置：

- Next.js 16 已移除 `next lint`，当前改为 ESLint CLI。
- 使用 `eslint-config-next/core-web-vitals` flat config。
- 保留 Next.js / React Hooks 规则，历史 `react-hooks/set-state-in-effect` 作为 warning 输出。

Error Count：0  
Warning Count：18  
主要 warning：

- `react-hooks/set-state-in-effect`
- `@next/next/no-img-element`
- `@next/next/no-page-custom-font`
- unused eslint-disable directive

### server lint

命令：

```bash
cd server
npm run lint
```

结果：PASS with warnings

配置：

- 使用 ESLint flat config。
- 使用 `@eslint/js` recommended。
- 使用 `typescript-eslint` recommended。
- 使用 Node globals。
- 保留 `no-explicit-any`、`no-unused-vars`、`prefer-const`、`no-useless-assignment` 检查，当前遗留问题作为 warning 输出。

Error Count：0  
Warning Count：38  
主要 warning：

- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/no-unused-vars`
- `prefer-const`
- `no-useless-assignment`

### admin-light lint

命令：

```bash
cd admin-light
npm run lint
```

结果：PASS with warnings

配置：

- 使用 ESLint flat config。
- 使用 `@eslint/js` recommended。
- 使用 `eslint-plugin-vue` flat recommended。
- 使用 Browser globals。
- 保留 Vue recommended 规则，历史单文件页面命名和模板格式问题作为 warning 输出。

Error Count：0  
Warning Count：568  
主要 warning：

- `vue/multi-word-component-names`
- `vue/max-attributes-per-line`
- `vue/singleline-html-element-content-newline`
- `vue/attributes-order`
- `vue/attribute-hyphenation`

## 4. 数据库检查

### Entity

当前 `server/src/database/entities` 下存在 14 个实体文件：

- `AdminUser`
- `AuditLog`
- `Card`
- `DrawPool`
- `GameConfig`
- `ImageJob`
- `MergeRule`
- `Player`
- `PlayerCollection`
- `PlayerDrawLog`
- `PlayerFragment`
- `PlayerInventory`
- `PlayerMergeLog`
- `PlayerSignin`

### Migration

当前存在：

```text
db/migrations/001_initial_schema.sql
```

问题：

- 该 SQL 更接近设计草稿，不是 TypeORM migration class。
- 当前 `server` 数据库配置使用 `synchronize: true` 自动建表。
- migration 与当前 Entity 集合不完全匹配。
- 生产环境缺少可靠的 migration 执行、回滚、版本记录机制。

### Seed

命令：

```bash
cd server
DATABASE_TYPE=sqlite DATABASE_URL=/private/tmp/guofeng_audit.sqlite JWT_SECRET=audit-secret npm run seed
```

结果：成功

输出摘要：

```text
Admin user ready
Cards: 151
Pools: 8
Merge Rules: 16
Configs: 19
Seed done!
```

### 数据库初始化

结果：成功

SQLite 临时库：

```text
/private/tmp/guofeng_audit.sqlite
```

初始化后表：

```text
admin_users
audit_logs
cards
draw_pools
game_configs
image_jobs
merge_rules
player_collection
player_draw_logs
player_fragments
player_inventory
player_merge_logs
player_signin
players
```

### 缺失表

以当前 TypeORM Entity + `synchronize: true` 为准：未发现运行时缺失表。

生产角度：存在 migration 覆盖缺口。关闭 `synchronize` 后，当前迁移文件不足以稳定创建生产数据库。

### 未使用字段 / 数据一致性风险

- `players.migration_done` 当前未发现有效业务使用。
- `player_fragments` 实体存在，但抽卡重复卡转碎片链路未写入该表，碎片系统与抽卡系统未真正闭环。
- 签到奖励中存在 `normal_ticket`，但当前未发现 ticket 持久化字段或库存表，奖励返回与持久化不一致。
- 种子数据的 `dynasty` / `dynasty_tag` 映射存在严重异常，多类卡牌被导入为 `qin_han`，导致合成结果跨朝代错配。

## 5. API 联调检查

验证方式：实际启动 `server` 源码模式，并调用真实 HTTP API。  
运行方式：

```bash
cd server
DATABASE_TYPE=sqlite DATABASE_URL=/private/tmp/guofeng_audit.sqlite JWT_SECRET=audit-secret PORT=3102 npx ts-node src/main.ts
```

Swagger 地址：

```text
http://localhost:3102/api/docs
```

### 链路结果

| 步骤 | API | 结果 | 备注 |
| --- | --- | --- | --- |
| 注册 | `POST /api/v1/auth/register` | PASS | 返回 `playerId` |
| 登录 | `POST /api/v1/auth/login` | PASS | 返回 JWT |
| 获取用户 | `GET /api/v1/auth/profile` | PASS | 返回当前用户名 |
| 抽卡 | `POST /api/v1/game/draw` | PASS | 返回 50 张卡牌 |
| 查询库存 | `GET /api/v1/game/inventory` | PASS | 返回库存行 |
| 合成 | `POST /api/v1/game/merge` | PASS | 返回合成结果 |
| 查询图鉴 | `GET /api/v1/game/collection` | PASS | 合成后图鉴数量增加 |
| 签到 | `POST /api/v1/game/signin` | PASS | 返回 streak |
| 签到状态 | `GET /api/v1/game/signin/status` | PASS | `signed_today: true` |

### 联调发现

合成接口可调用成功，但出现数据语义异常：

```json
{
  "success": true,
  "result_card_id": "SG-L-0031-L02",
  "name": "长坂坡",
  "rate": 1
}
```

该结果来自被标记为 `qin_han` 的输入集合，但产出卡牌 ID 呈现 `SG` 前缀，说明种子数据的朝代标签映射会影响合成正确性。

## 6. 前后端联调

验证方式：实际启动 `web` dev server，通过 Next.js API rewrite 访问后端和数据库。

服务：

```bash
cd web
API_TARGET=http://127.0.0.1:3102 npm run dev -- -p 3103
```

验证：

```bash
curl http://127.0.0.1:3103/
curl http://127.0.0.1:3103/api/public/bootstrap
```

结果：

- 首页 HTTP 200。
- `/api/public/bootstrap` HTTP 200。
- 返回数据来自 `server` 和 SQLite 数据库，包含 cards、pools、merge_rules、configs、stats。

结论：部分联通

说明：

- 开发模式下 Web -> Next rewrite -> Server -> SQLite 已打通。
- 生产构建层面已解除 `web build` 和 `server dist` 启动阻塞。
- 完整生产部署链路仍未验证，包括实际托管环境、反向代理、HTTPS、生产数据库和环境变量。

## 7. 核心 Bug 扫描

### 空指针 / 空值风险

- `web/app/draw/page.tsx` fallback `Card` 缺少 `mergeHint` 的构建阻塞已 RESOLVED。
- `web/app/draw/page.tsx` 中 `result: null as any` 已 RESOLVED。
- 多处 UI 依赖接口返回结构，缺少失败分支下的数据 shape 收敛。

### 未处理异常 / Promise 风险

- `admin-light/src/api/request.js` 在 401 时返回 `new Promise(() => {})`，会制造永不 resolve/reject 的请求，调用方可能悬挂。
- Web 侧多个 catch 只落 UI message 或 silent fallback，缺少集中错误上报。

### 类型断言风险

- `web/app/draw/page.tsx`
- `web/app/page.tsx`
- `web/lib/storage.ts`
- `web/lib/config-loader.ts`

上述文件存在 `as any` 或宽泛类型断言，削弱编译期保护。

### 数据一致性风险

- `server/src/modules/game-merge/game-merge.service.ts` generic merge 先消耗输入卡，再查询候选产物；如果候选为空，可能出现失败但输入已消耗的风险。
- generic merge 对相同 `card1Id === card2Id` 的场景缺少总数量校验，可能出现同一库存行被重复校验后再消费的风险。
- recipe merge 在失败时是否消耗输入缺少清晰产品约定，当前行为可能与用户预期冲突。
- 抽卡重复卡没有和 `PlayerFragment` 碎片表闭环。
- 签到奖励返回 ticket，但没有对应持久化资产模型。
- 种子数据朝代标签不一致，已经在实际合成链路中表现为错误语义。

### 安全风险

- `server/src/modules/game-auth/game-auth.service.ts` Douyin 登录仍为 Stub。
- `server/src/seed/seed.ts` 默认创建 `admin/admin123`。
- `server/docker-compose.yml` 包含示例 `JWT_SECRET=your-production-secret`。
- Web/admin token 存储在 `localStorage`，存在 XSS 后 token 泄露风险。
- 抽卡与合成使用 `Math.random`，不满足可审计、公平性或防刷要求。

### 依赖风险

安装依赖时 npm 报告：

- `server`：34 vulnerabilities，包含 13 high。
- `admin-light`：2 vulnerabilities，包含 1 high。

## 8. 生产风险评估

### P0

- RESOLVED：`web build` 失败，无法稳定交付生产前端。
- RESOLVED：`server dist/main` 启动失败，生产后端产物不可运行。
- 数据库 migration 体系缺失，生产依赖 `synchronize: true` 风险过高。
- 种子数据朝代/标签错误，影响核心合成玩法正确性。
- Douyin 登录为 Stub，无法作为真实抖音小游戏身份链路上线。

### P1

- lint 质量门禁已可运行，但 warning 未清零。
- 合成服务存在输入消耗与候选产物查询顺序风险。
- 相同卡牌合成缺少总数量一致性校验。
- 签到 ticket 奖励未持久化。
- 碎片系统未与抽卡重复卡闭环。
- 默认 admin 账号弱口令风险。
- npm high vulnerabilities 未处理。
- admin-light 包体过大，需要拆包。

### P2

- Web 侧 `as any` 和 fallback 类型绕过较多。
- 缺少 e2e 自动化联调测试。
- 缺少 API contract 自动校验。
- 缺少生产日志、审计、告警规范。
- 缺少数据备份、恢复、迁移演练文档。
- H5/抖音小游戏适配缺少平台容器验证。

## 9. 代码质量评分

评分：70 / 100

依据：

- 加分项：
  - Monorepo 模块边界清晰。
  - server 源码模式可跑通核心 API 链路。
  - SQLite 开发数据库可初始化。
  - admin-light 构建成功。
  - Web 开发模式可连通后端 bootstrap 数据。
  - Web 生产构建已通过。
  - Server 生产构建产物已可启动并响应核心接口。

- 扣分项：
  - lint 已可运行，但仍有 warning 债务。
  - migration 不可用于生产。
  - 核心配置/种子数据影响玩法正确性。
  - 平台登录、安全、依赖风险未解决。

## 10. Alpha Readiness

结论：不建议进入正式 Alpha，只适合继续 Early Alpha 内测。

当前可用：

- 源码模式后端核心 API 链路可打通。
- 开发模式 Web 可以访问后端公开 bootstrap 数据。
- 基础玩法链路具备验证价值。

进入 Alpha 前必须修复：

- RESOLVED：修复 `web build` TypeScript error。
- RESOLVED：修复 `server dist` 启动失败。
- 固化数据库 migration。
- 修正卡牌朝代/标签数据。
- 建立最小 lint/typecheck/build CI，并逐步清零 lint warnings。

Alpha Readiness：55%

## 11. Beta Readiness

结论：距离 Beta 仍有明显缺口。

Beta 前必须完成：

- 真实用户身份链路。
- 稳定资产模型，包括 ticket、fragment、card inventory。
- 可重复执行的 DB migration 和 seed 策略。
- API 自动化集成测试。
- Web 生产构建与部署验证。
- 后端生产启动与配置验证。
- 基础安全加固。

Beta Readiness：35%

## 12. Douyin Launch Readiness

结论：当前不具备抖音小游戏上线条件。

主要缺口：

- Douyin login 仍为 Stub。
- Web/H5 尚未完成抖音容器适配验证。
- 未验证抖音小游戏 H5 入口、授权、生命周期、分享、支付/广告能力。
- Web/H5 生产构建已通过，但未完成抖音容器验证。
- Server 生产产物已可启动，但未完成生产环境部署验证。
- 生产数据库迁移和配置未就绪。

Douyin Launch Readiness：25%

## 13. Recommended Fix Order

1. RESOLVED：修复 `web` TypeScript error，使 `npm run build` 通过。
2. RESOLVED：修复 `server` 编译产物模块缺失，使 `dist/main` 可启动。
3. RESOLVED：为 `web`、`server`、`admin-light` 恢复或新增 lint 脚本。
4. 修正 seed 数据的 `dynasty` / `dynasty_tag` 映射。
5. 将 TypeORM `synchronize: true` 替换为真实 migration 流程。
6. 修复合成服务的数据一致性风险。
7. 补齐 ticket、fragment 与 inventory 的资产闭环。
8. 替换默认 admin 弱口令与示例生产 secret。
9. 接入真实 Douyin 登录和 H5 容器验证。
10. 建立核心链路 e2e 自动化测试。

## 14. 审计结论

项目当前处于 Early Alpha。核心玩法 API 在开发环境可以跑通，但生产构建、生产启动、数据库迁移、数据一致性、安全配置和抖音平台能力仍存在阻塞。

短期目标应是先把项目从“源码可演示”推进到“生产构建可运行”，再推进 Alpha 测试。
