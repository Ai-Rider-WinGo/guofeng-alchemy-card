import type { CardMeta } from '../data/CardTypes';

export class CardManager {
  private readonly cardsById = new Map<string, CardMeta>();

  constructor(cards: CardMeta[]) {
    cards.forEach((card) => {
      this.cardsById.set(card.card_id, card);
    });
  }

  getAllCards(): CardMeta[] {
    return Array.from(this.cardsById.values());
  }

  getCard(cardId: string): CardMeta | undefined {
    return this.cardsById.get(cardId);
  }

  getCardsByLevel(level: number): CardMeta[] {
    return this.getAllCards().filter((card) => card.level === level);
  }

  hasCard(cardId: string): boolean {
    return this.cardsById.has(cardId);
  }
}

