import type { CardMeta, CollectionProgress } from '../data/CardTypes';
import { CardManager } from './CardManager';
import { InventoryManager } from './InventoryManager';

export class CollectionManager {
  constructor(
    private readonly cardManager: CardManager,
    private readonly inventoryManager: InventoryManager,
  ) {}

  getUnlockedCards(): CardMeta[] {
    return this.cardManager
      .getAllCards()
      .filter((card) => this.inventoryManager.hasCard(card.card_id));
  }

  getProgress(): CollectionProgress {
    const total = this.cardManager.getAllCards().length;
    const unlocked = this.getUnlockedCards().length;

    return {
      total,
      unlocked,
      percent: total === 0 ? 0 : Math.round((unlocked / total) * 100),
    };
  }
}

