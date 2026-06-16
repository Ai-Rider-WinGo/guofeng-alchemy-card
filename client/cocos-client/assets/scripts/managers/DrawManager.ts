import type { CardMeta, DailyLimits, DrawPool, DrawResult } from '../data/CardTypes';
import { CardManager } from './CardManager';
import { InventoryManager } from './InventoryManager';

export class DrawManager {
  private remainingDraws: number;

  constructor(
    private readonly pools: DrawPool[],
    private readonly limits: DailyLimits,
    private readonly cardManager: CardManager,
    private readonly inventoryManager: InventoryManager,
  ) {
    this.remainingDraws = limits.login_free_draws;
  }

  getRemainingDraws(): number {
    return this.remainingDraws;
  }

  draw(poolId: string, count = 1): DrawResult {
    const pool = this.pools.find((candidate) => candidate.pool_id === poolId);
    if (!pool) {
      throw new Error(`Draw pool not found: ${poolId}`);
    }

    const drawCount = Math.min(count, this.remainingDraws);
    const cards = Array.from({ length: drawCount }, () => this.drawOne(pool));

    this.remainingDraws -= drawCount;

    return {
      pool_id: pool.pool_id,
      cards,
      remaining_draws: this.remainingDraws,
    };
  }

  private drawOne(pool: DrawPool) {
    const candidates = pool.active_card_ids
      .map((cardId) => this.cardManager.getCard(cardId))
      .filter((card): card is CardMeta => Boolean(card));

    if (candidates.length === 0) {
      throw new Error(`Draw pool has no valid cards: ${pool.pool_id}`);
    }

    const selected = this.pickWeightedCard(candidates, pool);
    const isNew = !this.inventoryManager.hasCard(selected.card_id);
    const item = this.inventoryManager.addCard(selected.card_id);

    return {
      card_id: selected.card_id,
      is_new: isNew,
      quantity: item.quantity,
    };
  }

  private pickWeightedCard(cards: CardMeta[], pool: DrawPool): CardMeta {
    const weightedCards = cards.map((card) => ({
      card,
      weight: pool.rarity_weights[card.rarity] ?? 1,
    }));
    const totalWeight = weightedCards.reduce((sum, item) => sum + item.weight, 0);
    let cursor = Math.random() * totalWeight;

    for (const item of weightedCards) {
      cursor -= item.weight;
      if (cursor <= 0) {
        return item.card;
      }
    }

    return weightedCards[weightedCards.length - 1].card;
  }
}

