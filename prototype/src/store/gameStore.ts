import { create } from 'zustand';
import { CARDS, CARD_MAP } from '../data/cards';
import { findMergeRule } from '../data/merges';

export interface InventoryItem {
  card_id: string;
  quantity: number;
  star: number;
}

export interface DrawResult {
  card_id: string;
  is_new: boolean;
}

export interface MergeResult {
  success: boolean;
  output_card_id?: string;
  merge_desc?: string;
  message: string;
}

interface GameState {
  // 库存 card_id -> InventoryItem
  inventory: Record<string, InventoryItem>;
  // 已发现（图鉴）的 card_id 集合
  discovered: Set<string>;
  // 今日剩余抽卡次数
  remainingDraws: number;
  // 最近一次抽卡结果
  lastDrawResults: DrawResult[];
  // 最近一次合成结果
  lastMergeResult: MergeResult | null;
  // 已读图鉴 card_id 集合（用于本地持久化可忽略）
  codexRead: Set<string>;

  // Actions
  drawSingle: () => void;
  drawTen: () => void;
  merge: (cardA: string, cardB: string) => void;
  clearDrawResults: () => void;
  clearMergeResult: () => void;
  resetGame: () => void;
  getInventoryCards: () => InventoryItem[];
  canMerge: (cardA: string, cardB: string) => boolean;
  getAvailableMerges: () => Array<{ rule: ReturnType<typeof findMergeRule>; cardA: string; cardB: string }>;
}

const INITIAL_DRAWS = 20;

// 根据稀有度权重随机选一张卡
function weightedRandomPick(): string {
  const drawPool = CARDS.filter((c) => c.level <= 2);
  const weights: Record<string, number> = { common: 65, uncommon: 25, rare: 10 };
  const totalWeight = drawPool.reduce((sum, c) => sum + (weights[c.rarity] ?? 10), 0);
  let roll = Math.random() * totalWeight;
  for (const card of drawPool) {
    roll -= weights[card.rarity] ?? 10;
    if (roll <= 0) return card.card_id;
  }
  return drawPool[drawPool.length - 1].card_id;
}

function loadInventory(): Record<string, InventoryItem> {
  try {
    const saved = localStorage.getItem('guofeng_inventory');
    if (saved) return JSON.parse(saved);
  } catch {
    return {};
  }
  return {};
}

function loadDiscovered(): Set<string> {
  try {
    const saved = localStorage.getItem('guofeng_discovered');
    if (saved) return new Set(JSON.parse(saved));
  } catch {
    return new Set();
  }
  return new Set();
}

function loadDraws(): number {
  try {
    const saved = localStorage.getItem('guofeng_draws');
    if (saved !== null) return JSON.parse(saved);
  } catch {
    return INITIAL_DRAWS;
  }
  return INITIAL_DRAWS;
}

export const useGameStore = create<GameState>((set, get) => ({
  inventory: loadInventory(),
  discovered: loadDiscovered(),
  remainingDraws: loadDraws(),
  lastDrawResults: [],
  lastMergeResult: null,
  codexRead: new Set<string>(),

  drawSingle: () => {
    const { remainingDraws, inventory, discovered } = get();
    if (remainingDraws <= 0) return;

    const cardId = weightedRandomPick();
    const isNew = !inventory[cardId];
    const newInv = { ...inventory };
    const item = newInv[cardId] ?? { card_id: cardId, quantity: 0, star: 1 };
    newInv[cardId] = { ...item, quantity: item.quantity + 1 };

    const newDiscovered = new Set(discovered);
    newDiscovered.add(cardId);

    const newDraws = remainingDraws - 1;
    localStorage.setItem('guofeng_inventory', JSON.stringify(newInv));
    localStorage.setItem('guofeng_discovered', JSON.stringify([...newDiscovered]));
    localStorage.setItem('guofeng_draws', JSON.stringify(newDraws));

    set({
      inventory: newInv,
      discovered: newDiscovered,
      remainingDraws: newDraws,
      lastDrawResults: [{ card_id: cardId, is_new: isNew }],
    });
  },

  drawTen: () => {
    const { remainingDraws, inventory, discovered } = get();
    const count = Math.min(10, remainingDraws);
    if (count <= 0) return;

    const results: DrawResult[] = [];
    const newInv = { ...inventory };
    const newDiscovered = new Set(discovered);

    for (let i = 0; i < count; i++) {
      const cardId = weightedRandomPick();
      const isNew = !newInv[cardId];
      const item = newInv[cardId] ?? { card_id: cardId, quantity: 0, star: 1 };
      newInv[cardId] = { ...item, quantity: item.quantity + 1 };
      newDiscovered.add(cardId);
      results.push({ card_id: cardId, is_new: isNew });
    }

    const newDraws = remainingDraws - count;
    localStorage.setItem('guofeng_inventory', JSON.stringify(newInv));
    localStorage.setItem('guofeng_discovered', JSON.stringify([...newDiscovered]));
    localStorage.setItem('guofeng_draws', JSON.stringify(newDraws));

    set({
      inventory: newInv,
      discovered: newDiscovered,
      remainingDraws: newDraws,
      lastDrawResults: results,
    });
  },

  merge: (cardA: string, cardB: string) => {
    const { inventory, discovered } = get();
    const rule = findMergeRule(cardA, cardB);

    if (!rule) {
      set({ lastMergeResult: { success: false, message: '没有找到匹配的合成规则' } });
      return;
    }

    const itemA = inventory[cardA];
    const itemB = inventory[cardB];
    if (!itemA || itemA.quantity < 1 || !itemB || itemB.quantity < 1) {
      set({ lastMergeResult: { success: false, message: '卡牌数量不足' } });
      return;
    }
    if (cardA === cardB && itemA.quantity < 2) {
      set({ lastMergeResult: { success: false, message: '需要2张相同卡牌' } });
      return;
    }

    const newInv = { ...inventory };
    // 消耗输入卡
    const updA = { ...newInv[cardA], quantity: newInv[cardA].quantity - 1 };
    if (updA.quantity <= 0) delete newInv[cardA];
    else newInv[cardA] = updA;

    if (cardA !== cardB) {
      const updB = { ...newInv[cardB], quantity: newInv[cardB].quantity - 1 };
      if (updB.quantity <= 0) delete newInv[cardB];
      else newInv[cardB] = updB;
    }

    // 添加输出卡
    const outId = rule.output;
    const outItem = newInv[outId] ?? { card_id: outId, quantity: 0, star: 1 };
    newInv[outId] = { ...outItem, quantity: outItem.quantity + 1 };

    const newDiscovered = new Set(discovered);
    newDiscovered.add(outId);

    localStorage.setItem('guofeng_inventory', JSON.stringify(newInv));
    localStorage.setItem('guofeng_discovered', JSON.stringify([...newDiscovered]));

    set({
      inventory: newInv,
      discovered: newDiscovered,
      lastMergeResult: {
        success: true,
        output_card_id: outId,
        merge_desc: rule.merge_desc,
        message: `合成成功！获得【${CARD_MAP[outId]?.name}】`,
      },
    });
  },

  clearDrawResults: () => set({ lastDrawResults: [] }),
  clearMergeResult: () => set({ lastMergeResult: null }),

  resetGame: () => {
    localStorage.removeItem('guofeng_inventory');
    localStorage.removeItem('guofeng_discovered');
    localStorage.removeItem('guofeng_draws');
    set({
      inventory: {},
      discovered: new Set(),
      remainingDraws: INITIAL_DRAWS,
      lastDrawResults: [],
      lastMergeResult: null,
    });
  },

  getInventoryCards: () => {
    return Object.values(get().inventory).filter((i) => i.quantity > 0);
  },

  canMerge: (cardA: string, cardB: string) => {
    const { inventory } = get();
    const rule = findMergeRule(cardA, cardB);
    if (!rule) return false;
    const itemA = inventory[cardA];
    const itemB = inventory[cardB];
    if (!itemA || !itemB) return false;
    if (cardA === cardB) return itemA.quantity >= 2;
    return itemA.quantity >= 1 && itemB.quantity >= 1;
  },

  getAvailableMerges: () => {
    const { inventory } = get();
    const available: Array<{ rule: ReturnType<typeof findMergeRule>; cardA: string; cardB: string }> = [];
    const seen = new Set<string>();

    for (const rule of [
      { input_a: 'liubang_002', input_b: 'jixin_002', output: 'xingyang_escape_004', target_level: 4, success_rate: 1, consume_inputs: true, merge_desc: '', rule_id: '' },
      { input_a: 'xiangyu_002', input_b: 'zhanghan_002', output: 'julu_battle_004', target_level: 4, success_rate: 1, consume_inputs: true, merge_desc: '', rule_id: '' },
      { input_a: 'xingyang_escape_004', input_b: 'hongmenyan_004', output: 'chuhan_conflict_005', target_level: 5, success_rate: 1, consume_inputs: true, merge_desc: '', rule_id: '' },
      { input_a: 'chuhan_conflict_005', input_b: 'gaixia_siege_004', output: 'han_dynasty_founding_005', target_level: 5, success_rate: 1, consume_inputs: true, merge_desc: '', rule_id: '' },
    ]) {
      const key = [rule.input_a, rule.input_b].sort().join('+');
      if (seen.has(key)) continue;
      seen.add(key);

      const itemA = inventory[rule.input_a];
      const itemB = inventory[rule.input_b];
      if (!itemA || !itemB) continue;
      if (rule.input_a === rule.input_b && itemA.quantity < 2) continue;
      if (rule.input_a !== rule.input_b && (itemA.quantity < 1 || itemB.quantity < 1)) continue;

      available.push({
        rule: findMergeRule(rule.input_a, rule.input_b),
        cardA: rule.input_a,
        cardB: rule.input_b,
      });
    }
    return available;
  },
}));
