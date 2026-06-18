import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from '../../database/entities/card.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
  ) {}

  async getOverview() {
    const totalCards = await this.cardRepo.count();
    const activeCards = await this.cardRepo.count({ where: { is_active: true } });

    const byDynasty = await this.cardRepo
      .createQueryBuilder('card')
      .select('card.dynasty', 'dynasty')
      .addSelect('COUNT(*)', 'count')
      .groupBy('card.dynasty')
      .getRawMany();

    const byQuality = await this.cardRepo
      .createQueryBuilder('card')
      .select('card.quality', 'quality')
      .addSelect('COUNT(*)', 'count')
      .groupBy('card.quality')
      .getRawMany();

    const byType = await this.cardRepo
      .createQueryBuilder('card')
      .select('card.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('card.type')
      .getRawMany();

    return {
      total_cards: totalCards,
      active_cards: activeCards,
      by_dynasty: byDynasty,
      by_quality: byQuality,
      by_type: byType,
    };
  }
}
