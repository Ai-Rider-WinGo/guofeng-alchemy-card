import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from '../../database/entities/card.entity';
import { CreateCardDto, UpdateCardDto, QueryCardDto } from './dto/create-card.dto';

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
  ) {}

  async findAll(query: QueryCardDto) {
    const { dynasty, quality, type, keyword, page = 1, limit = 20 } = query;
    const qb = this.cardRepo.createQueryBuilder('card');

    if (dynasty) qb.andWhere('card.dynasty = :dynasty', { dynasty });
    if (quality) qb.andWhere('card.quality = :quality', { quality });
    if (type) qb.andWhere('card.type = :type', { type });

    if (keyword) {
      qb.andWhere('(card.name LIKE :kw OR card.tags LIKE :kw)', { kw: `%${keyword}%` });
    }

    qb.skip((page - 1) * limit).take(limit).orderBy('card.created_at', 'DESC');

    const [list, total] = await qb.getManyAndCount();
    return { list, total, page, limit };
  }

  async findOne(id: number) {
    const card = await this.cardRepo.findOne({ where: { id } });
    if (!card) throw new NotFoundException('卡牌不存在');
    return card;
  }

  async create(dto: CreateCardDto) {
    const card = this.cardRepo.create(dto);
    return this.cardRepo.save(card);
  }

  async update(id: number, dto: UpdateCardDto) {
    const card = await this.findOne(id);
    Object.assign(card, dto);
    return this.cardRepo.save(card);
  }

  async remove(id: number) {
    const card = await this.findOne(id);
    await this.cardRepo.remove(card);
    return { deleted: true };
  }

  async batchImport(cards: CreateCardDto[]) {
    const saved = [];
    for (const dto of cards) {
      const existing = await this.cardRepo.findOne({ where: { card_id: dto.card_id } });
      if (existing) {
        Object.assign(existing, dto);
        saved.push(await this.cardRepo.save(existing));
      } else {
        saved.push(await this.cardRepo.save(this.cardRepo.create(dto)));
      }
    }
    return { count: saved.length };
  }
}
