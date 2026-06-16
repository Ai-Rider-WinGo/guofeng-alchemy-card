import type { InventoryItem } from '../data/CardTypes';

function inventoryKey(cardId: string, star: number): string {
  return `${cardId}::${star}`;
}

export class InventoryManager {
  private readonly items = new Map<string, InventoryItem>();

  getItems(): InventoryItem[] {
    return Array.from(this.items.values()).map((item) => ({ ...item }));
  }

  getQuantity(cardId: string, star = 1): number {
    return this.items.get(inventoryKey(cardId, star))?.quantity ?? 0;
  }

  hasCard(cardId: string): boolean {
    return this.getItems().some((item) => item.card_id === cardId && item.quantity > 0);
  }

  addCard(cardId: string, quantity = 1, star = 1): InventoryItem {
    const key = inventoryKey(cardId, star);
    const current = this.items.get(key) ?? { card_id: cardId, star, quantity: 0 };
    const next = {
      ...current,
      quantity: current.quantity + quantity,
    };

    this.items.set(key, next);
    return { ...next };
  }

  removeCard(cardId: string, quantity = 1, star = 1): boolean {
    const key = inventoryKey(cardId, star);
    const current = this.items.get(key);

    if (!current || current.quantity < quantity || current.locked) {
      return false;
    }

    const nextQuantity = current.quantity - quantity;
    if (nextQuantity === 0) {
      this.items.delete(key);
    } else {
      this.items.set(key, { ...current, quantity: nextQuantity });
    }

    return true;
  }
}

