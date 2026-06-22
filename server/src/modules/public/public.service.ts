import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from '../../database/entities/card.entity';
import { DrawPool } from '../../database/entities/draw-pool.entity';
import { MergeRule } from '../../database/entities/merge-rule.entity';
import { GameConfig } from '../../database/entities/game-config.entity';

export interface PublicCardQuery {
  dynasty?: string;
  rarity?: string;
  type?: string;
  keyword?: string;
  page?: number;
  limit?: number;
}

/**
 * 公开只读数据服务。
 * 所有方法均为只读查询，严禁任何写操作。
 * 数据来源：后端 cards / draw_pools / merge_rules / game_configs 表（权威源）。
 */
@Injectable()
export class PublicService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
    @InjectRepository(DrawPool)
    private readonly poolRepo: Repository<DrawPool>,
    @InjectRepository(MergeRule)
    private readonly ruleRepo: Repository<MergeRule>,
    @InjectRepository(GameConfig)
    private readonly configRepo: Repository<GameConfig>,
  ) {}

  // ============ 卡牌 ============

  async findCards(query: PublicCardQuery) {
    const { dynasty, rarity, type, keyword, page = 1, limit = 20 } = query;
    const qb = this.cardRepo
      .createQueryBuilder('card')
      .where('card.is_active = :active', { active: true });

    if (dynasty) qb.andWhere('card.dynasty = :dynasty', { dynasty });
    if (rarity) qb.andWhere('card.rarity = :rarity', { rarity });
    if (type) qb.andWhere('card.type = :type', { type });
    if (keyword) {
      qb.andWhere('(card.name LIKE :kw OR card.tags LIKE :kw)', { kw: `%${keyword}%` });
    }

    qb.skip((page - 1) * limit).take(limit).orderBy('card.level', 'ASC').addOrderBy('card.id', 'ASC');

    const [list, total] = await qb.getManyAndCount();
    return { list, total, page, limit };
  }

  async findCardByCardId(cardId: string) {
    const card = await this.cardRepo.findOne({ where: { card_id: cardId, is_active: true } });
    if (!card) throw new NotFoundException('卡牌不存在');
    return card;
  }

  /** 全部可用卡（不分页，供 bootstrap 聚合） */
  async findAllActiveCards() {
    return this.cardRepo.find({
      where: { is_active: true },
      order: { level: 'ASC', id: 'ASC' },
    });
  }

  // ============ 抽卡池 ============

  async findPools() {
    return this.poolRepo.find({
      where: { is_active: true },
      order: { id: 'ASC' },
    });
  }

  async findPoolByPoolId(poolId: string) {
    const pool = await this.poolRepo.findOne({ where: { pool_id: poolId, is_active: true } });
    if (!pool) throw new NotFoundException('卡池不存在');
    return pool;
  }

  // ============ 合成规则 ============

  async findMergeRules() {
    return this.ruleRepo.find({
      where: { is_active: true },
      order: { id: 'ASC' },
    });
  }

  // ============ 玩法配置 ============

  async findConfigs(category?: string) {
    const where: any = {};
    if (category) where.category = category;
    return this.configRepo.find({ where, order: { category: 'ASC', config_key: 'ASC' } });
  }

  async findConfig(key: string) {
    const config = await this.configRepo.findOne({ where: { config_key: key } });
    if (!config) throw new NotFoundException('配置不存在');
    return config;
  }

  // ============ 聚合（bootstrap） ============

  /** 客户端启动时一次性拉取全部配置数据，减少首屏请求数。 */
  async bootstrap() {
    const [cards, pools, mergeRules, allConfigs] = await Promise.all([
      this.findAllActiveCards(),
      this.findPools(),
      this.findMergeRules(),
      this.configRepo.find({ order: { category: 'ASC', config_key: 'ASC' } }),
    ]);

    // 卡牌统计
    const byDynasty = this.groupCount(cards, (c) => c.dynasty);
    const byRarity = this.groupCount(cards, (c) => c.rarity);
    const byType = this.groupCount(cards, (c) => c.type);

    // 把 game_configs 按 category 聚合成对象，方便前端按类取用
    const configsByCategory: Record<string, any[]> = {};
    for (const cfg of allConfigs) {
      const cat = cfg.category || 'misc';
      let parsed: any = cfg.config_value;
      try {
        parsed = JSON.parse(cfg.config_value);
      } catch {
        parsed = cfg.config_value;
      }
      if (!configsByCategory[cat]) configsByCategory[cat] = [];
      configsByCategory[cat].push({ key: cfg.config_key, value: parsed, description: cfg.description });
    }

    return {
      generated_at: new Date().toISOString(),
      cards,
      pools,
      merge_rules: mergeRules,
      configs: configsByCategory,
      stats: {
        total_cards: cards.length,
        by_dynasty: byDynasty,
        by_rarity: byRarity,
        by_type: byType,
      },
    };
  }

  private groupCount<T>(items: T[], keyFn: (item: T) => string | null | undefined) {
    const map: Record<string, number> = {};
    for (const item of items) {
      const key = keyFn(item);
      if (!key) continue;
      map[key] = (map[key] || 0) + 1;
    }
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }
}
