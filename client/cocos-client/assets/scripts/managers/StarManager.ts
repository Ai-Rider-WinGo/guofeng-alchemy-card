import { InventoryManager } from './InventoryManager';

export interface StarUpResult {
  success: boolean;
  card_id: string;
  from_star: number;
  new_star?: number;
  message?: string;
}

export class StarManager {
  constructor(private readonly inventoryManager: InventoryManager) {}

  starUp(cardId: string, fromStar: number): StarUpResult {
    if (fromStar < 1 || fromStar >= 5) {
      return {
        success: false,
        card_id: cardId,
        from_star: fromStar,
        message: '星级范围无效',
      };
    }

    if (this.inventoryManager.getQuantity(cardId, fromStar) < 2) {
      return {
        success: false,
        card_id: cardId,
        from_star: fromStar,
        message: '同名同星卡不足',
      };
    }

    this.inventoryManager.removeCard(cardId, 2, fromStar);
    this.inventoryManager.addCard(cardId, 1, fromStar + 1);

    return {
      success: true,
      card_id: cardId,
      from_star: fromStar,
      new_star: fromStar + 1,
    };
  }
}

