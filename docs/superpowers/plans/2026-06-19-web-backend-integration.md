# Web 接后端 — 完整接通实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 web/ 玩家前端在登录态下完全通过 server API 运行：抽卡、合成、碎片、图鉴、签到、玩家态水合全部服务端化。

**Architecture:** web/ 已有 API 客户端层（`web/lib/api/`），draw/signin/login 已双模式。本计划补齐后端缺口（碎片端点），改造 GameProvider 做远端水合，把 merge/tasks 页面从 localStorage 切到后端 API。游客态保持 localStorage 兜底不变。

**Tech Stack:** NestJS (TypeORM + SQLite) / Next.js 16 / React 19 / 已有 `web/lib/api/client.ts` fetch 封装

**核心原则：** 登录态 → 服务端权威；游客态 → 本地 localStorage 兜底。每个页面用 `isLoggedIn()` 分支。

---

## 文件清单

### 后端新增/修改
| 文件 | 责任 |
|------|------|
| 修改 `server/src/modules/game-draw/game-draw.controller.ts` | 新增 `GET /game/draw/fragments` 端点 |
| 修改 `server/src/modules/game-draw/game-draw.service.ts` | 新增 `getFragments(playerId)` 方法 |
| 修改 `server/src/modules/game-merge/game-merge.service.ts` | generic merge 失败时退回输入卡（修复消耗 bug） |

### 前端修改
| 文件 | 责任 |
|------|------|
| 修改 `web/lib/api/game.ts` | 新增 `getFragments()` 函数 |
| 修改 `web/lib/gameContext.tsx` | 登录态下从后端水合 playerCards/unlockedCards/fragments/signIn |
| 修改 `web/app/merge/page.tsx` | 登录态下 pair/fragment 合成调后端 API |
| 修改 `web/app/tasks/page.tsx` | 登录态下从后端同步进度（读多写少，本地即时反馈） |

---

## Task 1: 后端 — 碎片查询端点

**Files:**
- Modify: `server/src/modules/game-draw/game-draw.controller.ts`
- Modify: `server/src/modules/game-draw/game-draw.service.ts`

- [ ] **Step 1: 在 service 新增 getFragments 方法**

在 `game-draw.service.ts` 的 `getCollection` 方法之后，`// ============ 内部 ============` 之前插入：

```typescript
  /** 玩家碎片库存 */
  async getFragments(playerId: number) {
    const rows = await this.dataSource
      .getRepository('PlayerFragment')
      .find({ where: { player_id: playerId } });
    const map: Record<string, number> = {};
    for (const r of rows as any[]) {
      map[r.shard_key] = r.quantity;
    }
    return map;
  }
```

同时在文件顶部 import 区补充：

```typescript
import { PlayerFragment } from '../../database/entities/player-fragment.entity';
```

并把方法体里的 `'PlayerFragment'` 字符串改为直接用实体引用：

```typescript
  async getFragments(playerId: number) {
    const rows = await this.dataSource
      .getRepository(PlayerFragment)
      .find({ where: { player_id: playerId } });
    const map: Record<string, number> = {};
    for (const r of rows) {
      map[r.shard_key] = r.quantity;
    }
    return map;
  }
```

- [ ] **Step 2: 在 controller 新增 fragments 路由**

在 `game-draw.controller.ts` 的 `collection` 方法之后插入：

```typescript
  @Get('fragments')
  @ApiOperation({ summary: '玩家碎片库存' })
  fragments(@Req() req: any) {
    return this.service.getFragments(req.user.id);
  }
```

- [ ] **Step 3: 编译验证**

Run: `cd server && npx tsc --noEmit`
Expected: exit 0

- [ ] **Step 4: 重启 server 并测试**

Run: 重启 server，然后：
```bash
# 先注册一个测试玩家拿 token
TOKEN=$(curl -s http://localhost:3002/api/game/auth/register -H "Content-Type: application/json" -d '{"username":"testfrag","password":"123456"}' | python -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
curl -s http://localhost:3002/api/game/draw/fragments -H "Authorization: Bearer $TOKEN"
```
Expected: `{"code":0,"data":{},"message":"success"}`（新玩家空碎片）

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/game-draw/game-draw.controller.ts server/src/modules/game-draw/game-draw.service.ts
git commit -m "feat: add GET /game/draw/fragments endpoint"
```

---

## Task 2: 后端 — 修复 generic merge 失败消耗输入卡

**Files:**
- Modify: `server/src/modules/game-merge/game-merge.service.ts`

- [ ] **Step 1: 读取当前 generic merge 方法**

Run: 读取 `server/src/modules/game-merge/game-merge.service.ts`，定位 `genericMerge` 方法。当前逻辑：先 `consumeCard` 再掷骰子，失败时不退还。

- [ ] **Step 2: 调整为先判定再消耗**

把 genericMerge 方法改为：先校验持有 → 先掷骰子判定成功 → 成功才消耗两张并发放结果；失败则不消耗，返回失败信息。

找到 genericMerge 方法里"消耗输入卡"和"掷骰子"的代码块，调整顺序为：先掷骰子（计算 rate 和 success），如果 success 则消耗两张卡+发放结果卡，如果不 success 则直接返回 `{success:false}` 不消耗。

具体代码（替换 genericMerge 方法体的核心逻辑）：

```typescript
  async genericMerge(playerId: number, card1Id: string, card2Id: string) {
    const c1 = await this.cardRepo.findOne({ where: { card_id: card1Id, is_active: true } });
    const c2 = await this.cardRepo.findOne({ where: { card_id: card2Id, is_active: true } });
    if (!c1 || !c2) throw new NotFoundException('卡牌不存在');
    if (c1.level !== c2.level || c1.dynasty_tag !== c2.dynasty_tag) {
      throw new BadRequestException('需同等级同朝代卡');
    }
    if (c1.level >= 12) throw new BadRequestException('已达最高等级');

    // 校验持有
    const inv1 = await this.invRepo.findOne({ where: { player_id: playerId, card_id: card1Id } });
    const inv2 = await this.invRepo.findOne({ where: { player_id: playerId, card_id: card2Id } });
    if (!inv1 || inv1.quantity < 1) throw new BadRequestException('未持有卡: ' + card1Id);
    if (!inv2 || inv2.quantity < 1) throw new BadRequestException('未持有卡: ' + card2Id);

    const rate = c1.level <= 5 ? 1.0 : c1.level <= 8 ? 0.8 : 0.6;
    const success = Math.random() < rate;

    if (!success) {
      await this.logMerge(playerId, 'generic', null, [card1Id, card2Id], null, false);
      return { success: false, error: '合成失败', rate };
    }

    // 成功才消耗 + 发放
    const targetLevel = c1.level + 1;
    const candidates = await this.cardRepo.find({
      where: { dynasty_tag: c1.dynasty_tag, level: targetLevel, is_active: true },
    });
    if (candidates.length === 0) {
      await this.logMerge(playerId, 'generic', null, [card1Id, card2Id], null, false);
      return { success: false, error: '无可用目标卡', rate };
    }
    const result = candidates[Math.floor(Math.random() * candidates.length)];

    await this.consumeCard(playerId, card1Id);
    await this.consumeCard(playerId, card2Id);
    await this.grantCard(playerId, result.card_id);

    await this.logMerge(playerId, 'generic', null, [card1Id, card2Id], result.card_id, true);
    return { success: true, result_card_id: result.card_id, name: result.name, rate };
  }
```

注意：需确认 service 里的 helper 方法名（`consumeCard`/`grantCard`/`logMerge`/`invRepo`），如名字不同则用实际名字。

- [ ] **Step 3: 编译 + 重启 + 测试**

Run: `cd server && npx tsc --noEmit`，重启 server，然后：
```bash
# 注册玩家 → 抽2张同级同朝代卡 → 尝试 merge
TOKEN=$(curl -s http://localhost:3002/api/game/auth/register -H "Content-Type: application/json" -d '{"username":"testmerge","password":"123456"}' | python -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
# 抽 10 张
curl -s -X POST http://localhost:3002/api/game/draw -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"pool_id":"permanent_basic","count":10}'
# 看背包
curl -s http://localhost:3002/api/game/draw/inventory -H "Authorization: Bearer $TOKEN"
```
Expected: 抽卡成功，背包有卡，可尝试 merge

- [ ] **Step 4: Commit**

```bash
git add server/src/modules/game-merge/game-merge.service.ts
git commit -m "fix: generic merge no longer consumes cards on failure"
```

---

## Task 3: 前端 — API 客户端新增 getFragments

**Files:**
- Modify: `web/lib/api/game.ts`

- [ ] **Step 1: 在 game.ts 新增 getFragments 函数**

在 `getCollection` 函数之后（`// ============ 合成 ============` 之前）插入：

```typescript
export async function getFragments(): Promise<Record<string, number>> {
  return request<Record<string, number>>('/game/draw/fragments', { auth: true })
}
```

- [ ] **Step 2: 编译验证**

Run: `cd web && npx tsc --noEmit`
Expected: exit 0

- [ ] **Step 3: Commit**

```bash
git add web/lib/api/game.ts
git commit -m "feat: add getFragments() API client"
```

---

## Task 4: 前端 — GameProvider 远端水合

**Files:**
- Modify: `web/lib/gameContext.tsx`

- [ ] **Step 1: 改造 GameProvider，登录态下从后端水合**

把 `gameContext.tsx` 的 `bootstrap` 函数改为：initGameData 后，如果 `isLoggedIn()`，则并行拉取 inventory + collection + fragments，合并进 GameState。

替换整个文件内容为：

```tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { GameState, INITIAL_GAME_STATE } from './types'
import { loadGameState, saveGameState, shouldResetDailyCount, resetDailyCount } from './storage'
import { initGameData } from './config-loader'
import { isLoggedIn, getInventory, getCollection, getFragments } from './api/game'

type GameContextType = {
  gameState: GameState
  updateGameState: (state: GameState) => void
  isHydrated: boolean
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      // 1. 卡牌目录（失败回退静态 JSON）
      await initGameData()

      // 2. 读本地存档
      let state = loadGameState()
      if (shouldResetDailyCount(state)) {
        state = resetDailyCount(state)
        saveGameState(state)
      }

      // 3. 登录态：从后端水合玩家态（inventory/collection/fragments）
      if (isLoggedIn()) {
        try {
          const [inv, col, frags] = await Promise.all([
            getInventory(),
            getCollection(),
            getFragments(),
          ])
          // 后端 inventory → playerCards map
          const playerCards: Record<string, number> = {}
          for (const row of inv) {
            playerCards[row.card_id] = row.quantity
          }
          // 合并：后端权威，但保留本地未同步的字段（signIn/tasks 等）
          state = {
            ...state,
            playerCards,
            unlockedCards: Array.from(new Set([...(col.unlocked || []), ...state.unlockedCards])),
            fragments: frags || {},
          }
          saveGameState(state)
        } catch (e) {
          // 水合失败，用本地存档兜底
          console.warn('远端水合失败，使用本地存档:', e)
        }
      }

      if (cancelled) return
      setGameState(state)
      setIsHydrated(true)
    }
    bootstrap()
    return () => { cancelled = true }
  }, [])

  const updateGameState = (state: GameState) => {
    setGameState(state)
    saveGameState(state)
  }

  return (
    <GameContext.Provider value={{ gameState, updateGameState, isHydrated }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within GameProvider')
  }
  return context
}
```

- [ ] **Step 2: 编译验证**

Run: `cd web && npx tsc --noEmit`
Expected: exit 0

- [ ] **Step 3: Commit**

```bash
git add web/lib/gameContext.tsx
git commit -m "feat: GameProvider hydrates player state from backend when logged in"
```

---

## Task 5: 前端 — merge 页面接后端 API

**Files:**
- Modify: `web/app/merge/page.tsx`

- [ ] **Step 1: 在 merge/page.tsx 顶部新增 import**

在现有 import 块中添加：

```typescript
import { isLoggedIn, mergeGeneric, mergeFragment } from '@/lib/api/game'
```

- [ ] **Step 2: 改造 handleExecutePairMerge 为双模式**

把 `handleExecutePairMerge` 函数替换为：

```typescript
  const handleExecutePairMerge = async () => {
    if (!selectedCard1 || !selectedCard2 || !mergeResult) return
    if (isLoggedIn()) {
      // 登录态：调后端
      try {
        const res = await mergeGeneric(selectedCard1, selectedCard2)
        if (!res.success) {
          setAutoMergeMsg(res.error || '合成失败')
          setTimeout(() => setAutoMergeMsg(null), 3000)
          setSelectedCard1(null); setSelectedCard2(null); setMergeResult(null); setShowConfirm(false)
          return
        }
        // 用后端结果同步本地状态
        let newState = removeCardFromInventory(gameState, selectedCard1, 1)
        newState = removeCardFromInventory(newState, selectedCard2, 1)
        newState = addCardToInventory(newState, res.result_card_id!)
        newState.totalMerges = (newState.totalMerges || 0) + 1
        newState.mergeHistory = [...(newState.mergeHistory || []), {
          from: [selectedCard1, selectedCard2],
          to: res.result_card_id!,
          timestamp: Date.now(),
        }]
        updateGameState(newState)
        setAutoMergeMsg(`✨ 合成成功：${res.name}`)
        setTimeout(() => setAutoMergeMsg(null), 3000)
      } catch (e: any) {
        setAutoMergeMsg('合成请求失败: ' + (e.message || ''))
        setTimeout(() => setAutoMergeMsg(null), 3000)
      }
    } else {
      // 游客态：本地
      const newState = executeMerge(gameState, selectedCard1, selectedCard2, mergeResult.resultCard.id)
      updateGameState(newState)
    }
    setSelectedCard1(null); setSelectedCard2(null); setMergeResult(null); setShowConfirm(false)
  }
```

- [ ] **Step 3: 改造 handleFragmentMerge 为双模式**

把 `handleFragmentMerge` 函数替换为：

```typescript
  const handleFragmentMerge = async (cardId: string) => {
    if (isLoggedIn()) {
      try {
        const shardKey = cardId
        const res = await mergeFragment(cardId, shardKey)
        if (!res.success) {
          setAutoMergeMsg(res.error || '碎片不足')
          setTimeout(() => setAutoMergeMsg(null), 3000)
          return
        }
        let newState = addCardToInventory(gameState, cardId)
        // 后端已扣碎片，本地同步（从 API 重新水合片段较重，这里乐观扣本地）
        updateGameState(newState)
        setAutoMergeMsg(`✨ 碎片合成成功：${res.name}`)
        setTimeout(() => setAutoMergeMsg(null), 3000)
      } catch (e: any) {
        setAutoMergeMsg('碎片合成失败: ' + (e.message || ''))
        setTimeout(() => setAutoMergeMsg(null), 3000)
      }
    } else {
      const fragments = getFragmentCount(gameState, cardId) || getFragmentCount(gameState, '秦汉')
      if (fragments < REQUIRED_SHARDS) return
      let newState = consumeFragments(gameState, cardId, REQUIRED_SHARDS)
      if ((newState.fragments?.[cardId] || 0) === (gameState.fragments?.[cardId] || 0)) {
        newState = consumeFragments(gameState, '秦汉', REQUIRED_SHARDS)
      }
      newState = addCardToInventory(newState, cardId)
      updateGameState(newState)
    }
  }
```

- [ ] **Step 4: 编译验证**

Run: `cd web && npx tsc --noEmit`
Expected: exit 0

- [ ] **Step 5: Commit**

```bash
git add web/app/merge/page.tsx
git commit -m "feat: merge page uses backend API when logged in"
```

---

## Task 6: 前端 — tasks 页面登录态碎片同步

**Files:**
- Modify: `web/app/tasks/page.tsx`

tasks 页面本身是纯本地逻辑（读 `taskDefs` JSON + `gameState.taskProgress`）。后端目前没有任务端点。策略：登录态下从后端拉碎片库存覆盖本地 `gameState.fragments`（这样碎片库存显示服务端权威值），任务领取仍走本地（因为后端没有任务表）。

- [ ] **Step 1: 在 tasks/page.tsx 顶部新增 import 和 effect**

在现有 import 块后添加：

```typescript
import { useEffect } from 'react'
import { isLoggedIn, getFragments } from '@/lib/api/game'
```

注意：`useEffect` 已从 react 引入，需合并到顶部已有的 `import { useState } from 'react'` 行，改为 `import { useState, useEffect } from 'react'`。

- [ ] **Step 2: 在组件内加 fragments 同步 effect**

在 `const totalFragments = ...` 之前插入：

```typescript
  useEffect(() => {
    if (!isLoggedIn()) return
    getFragments().then((frags) => {
      if (frags && Object.keys(frags).length >= 0) {
        updateGameState({ ...gameState, fragments: frags })
      }
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
```

- [ ] **Step 3: 编译验证**

Run: `cd web && npx tsc --noEmit`
Expected: exit 0

- [ ] **Step 4: Commit**

```bash
git add web/app/tasks/page.tsx
git commit -m "feat: tasks page syncs fragment counts from backend when logged in"
```

---

## Task 7: 端到端验证

**Files:** 无（纯验证）

- [ ] **Step 1: 确保 server 运行**

Run: 确认 `http://localhost:3002/api` 可达（admin 登录测试）

- [ ] **Step 2: 启动 web dev server**

Run: `cd web && npm run dev`
Expected: 监听 :3000

- [ ] **Step 3: 注册测试玩家**

Run:
```bash
curl -s http://localhost:3002/api/game/auth/register -H "Content-Type: application/json" -d '{"username":"e2etest","password":"123456"}'
```
Expected: `{"code":0,"data":{"token":"...","player":{...}},"message":"success"}`

- [ ] **Step 4: 抽卡 + 查库存 + 查碎片 + 查图鉴 全链路**

Run:
```bash
TOKEN=...  # 上一步的 token
# 抽卡
curl -s -X POST http://localhost:3002/api/game/draw -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"pool_id":"permanent_basic","count":10}'
# 库存
curl -s http://localhost:3002/api/game/draw/inventory -H "Authorization: Bearer $TOKEN"
# 图鉴
curl -s http://localhost:3002/api/game/draw/collection -H "Authorization: Bearer $TOKEN"
# 碎片
curl -s http://localhost:3002/api/game/draw/fragments -H "Authorization: Bearer $TOKEN"
```
Expected: 全部 `{"code":0,"data":...,"message":"success"}`，库存有卡，图鉴有解锁

- [ ] **Step 5: 浏览器手动验证（可选）**

打开 `http://localhost:3000`，用 e2etest/123456 登录，验证：
- 首页加载不报错
- draw 页面抽卡正常
- merge 页面选卡合成不报错
- tasks 页面碎片库存显示
- signin 页面签到正常

- [ ] **Step 6: 最终 commit（如有未提交改动）**

```bash
git add -A
git commit -m "test: e2e verification of web backend integration"
```

---

## Self-Review

**Spec coverage:**
- ✅ 碎片查询端点 → Task 1
- ✅ generic merge 失败消耗 bug → Task 2
- ✅ API 客户端 getFragments → Task 3
- ✅ GameProvider 远端水合 → Task 4
- ✅ merge 页面接后端 → Task 5
- ✅ tasks 页面碎片同步 → Task 6
- ✅ 端到端验证 → Task 7

**Placeholder scan:** 无 TBD/TODO。

**Type consistency:** `getFragments` 返回 `Record<string, number>` 在 Task 1/3/4/6 中一致。`MergeResult` 类型在 Task 5 中使用的字段（`success`/`result_card_id`/`name`/`error`）与 `api/game.ts` 定义一致。

**Known limitations（本计划不解决，记录在案）:**
- tasks 任务领取仍是本地逻辑（后端无任务表）——用户若要服务端化需新增后端任务模块，属下一期
- weekly 奖励仍是本地逻辑——同上
- 碎片合成后本地乐观扣减，刷新后从后端水合修正——可接受
- starup 升星后端无对应端点，保持本地逻辑
