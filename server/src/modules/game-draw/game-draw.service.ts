import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Card } from '../../database/entities/card.entity';
import { DrawPool } from '../../database/entities/draw-pool.entity';
import { GameConfig } from '../../database/entities/game-config.entity';
import { PlayerInventory } from '../../database/entities/player-inventory.entity';
import { PlayerCollection } from '../../database/entities/player-collection.entity';
import { PlayerDrawLog } from '../../database/entities/player-draw-log.entity';
import { PlayerFragment } from '../../database/entities/player-fragment.entity';

const RARITY_ORDER = ['N', 'R', 'SR', 'SSR', 'UR'];

@Injectable()
export class GameDrawService {
  constructor(
    @InjectRepository(Card) private readonly cardRepo: Repository<Card>,
    @InjectRepository(DrawPool) private readonly poolRepo: Repository<DrawPool>,
    @InjectRepository(GameConfig) private readonly configRepo: Repository<GameConfig>,
    @InjectRepository(PlayerDrawLog) private readonly drawLogRepo: Repository<PlayerDrawLog>,
    private readonly dataSource: DataSource,
  ) {}

  /** 执行抽卡（核心，全服务端） */
  async draw(playerId: number, poolId: string, count: number = 1) {
    if (count < 1 || count > 10) throw new BadRequestException('单次抽卡 1-10 张');

    const pool = await this.poolRepo.findOne({ where: { pool_id: poolId, is_active: true } });
    if (!pool) throw new NotFoundException('卡池不存在或已下架: ' + poolId);

    // 1. 每日次数限制
    const dailyLimit = await this.getDailyDrawLimit();
    const todayCount = await this.countTodayDraws(playerId);
    const remaining = dailyLimit - todayCount;
    if (remaining <= 0) throw new BadRequestException('今日抽卡次数已用完');
    const actualCount = Math.min(count, remaining);

    // 2. 候选卡：featured + 池朝代匹配的卡（或全部 active 卡）
    const candidateCards = await this.getCandidateCards(pool);

    // 3. 逐张抽取（服务端随机）
    const results: Card[] = [];
    for (let i = 0; i < actualCount; i++) {
      const card = this.rollOne(pool, candidateCards);
      results.push(card);
    }

    // 4. 事务写库：背包 + 图鉴 + 流水
    await this.dataSource.transaction(async (manager) => {
      for (const card of results) {
        // 背包（存在则 +1）
        const invRepo = manager.getRepository(PlayerInventory);
        let inv = await invRepo.findOne({ where: { player_id: playerId, card_id: card.card_id } });
        if (inv) {
          inv.quantity += 1;
          await invRepo.save(inv);
        } else {
          await invRepo.save(invRepo.create({ player_id: playerId, card_id: card.card_id, quantity: 1, star_level: 1 }));
        }
        // 图鉴（首次解锁）
        const colRepo = manager.getRepository(PlayerCollection);
        const exist = await colRepo.findOne({ where: { player_id: playerId, card_id: card.card_id } });
        if (!exist) {
          await colRepo.save(colRepo.create({ player_id: playerId, card_id: card.card_id }));
        }
        // 流水
        const logRepo = manager.getRepository(PlayerDrawLog);
        await logRepo.save(logRepo.create({ player_id: playerId, pool_id: poolId, card_id: card.card_id, rarity: card.rarity }));
      }
    });

    return {
      pool_id: poolId,
      drawn: results.map((c) => ({
        card_id: c.card_id,
        name: c.name,
        rarity: c.rarity,
        level: c.level,
        dynasty: c.dynasty,
        image_url: c.image_url,
        thumbnail_url: c.thumbnail_url,
      })),
      today_count: todayCount + actualCount,
      daily_limit: dailyLimit,
      remaining: remaining - actualCount,
    };
  }

  /** 当日剩余次数 */
  async getRemaining(playerId: number) {
    const dailyLimit = await this.getDailyDrawLimit();
    const todayCount = await this.countTodayDraws(playerId);
    return { daily_limit: dailyLimit, today_count: todayCount, remaining: Math.max(0, dailyLimit - todayCount) };
  }

  /** 玩家背包 */
  async getInventory(playerId: number) {
    return this.dataSource.getRepository(PlayerInventory).find({ where: { player_id: playerId }, order: { updated_at: 'DESC' } });
  }

  /** 玩家图鉴（解锁的 card_id 列表） */
  async getCollection(playerId: number) {
    const rows = await this.dataSource.getRepository(PlayerCollection).find({ where: { player_id: playerId } });
    return { unlocked: rows.map((r) => r.card_id), count: rows.length };
  }

  /** 玩家碎片库存 */
  async getFragments(playerId: number) {
    const rows = await this.dataSource.getRepository(PlayerFragment).find({ where: { player_id: playerId } });
    const map: Record<string, number> = {};
    for (const r of rows) {
      map[r.shard_key] = r.quantity;
    }
    return map;
  }

  // ============ 内部 ============

  private rollOne(pool: DrawPool, candidates: Card[]): Card {
    const weights = pool.rarity_weights || {};
    // 加权随机选稀有度
    const totalWeight = RARITY_ORDER.reduce((s, r) => s + (Number(weights[r]) || 0), 0);
    let roll = Math.random() * totalWeight;
    let selectedRarity = RARITY_ORDER[0];
    for (const r of RARITY_ORDER) {
      const w = Number(weights[r]) || 0;
      if (roll < w) { selectedRarity = r; break; }
      roll -= w;
    }
    // 该稀有度的候选卡
    let pool_cards = candidates.filter((c) => c.rarity === selectedRarity);
    if (pool_cards.length === 0) {
      // 该稀有度无卡，降级到任意候选
      pool_cards = candidates;
    }
    if (pool_cards.length === 0) throw new BadRequestException('卡池无可用卡牌');
    return pool_cards[Math.floor(Math.random() * pool_cards.length)];
  }

  private async getCandidateCards(pool: DrawPool): Promise<Card[]> {
    const featured = pool.featured_card_ids || [];
    let cards: Card[];
    if (featured.length > 0) {
      cards = await this.cardRepo.find({ where: featured.map((id) => ({ card_id: id, is_active: true })) });
    } else if (pool.dynasty_tag) {
      cards = await this.cardRepo.find({ where: { dynasty_tag: pool.dynasty_tag, is_active: true } });
    } else {
      cards = await this.cardRepo.find({ where: { is_active: true } });
    }
    if (cards.length === 0) {
      // 兜底：全部 active 卡
      cards = await this.cardRepo.find({ where: { is_active: true } });
    }
    return cards;
  }

  private async getDailyDrawLimit(): Promise<number> {
    const cfg = await this.configRepo.findOne({ where: { category: 'daily_limits' } });
    if (!cfg) return 50; // 兜底
    try {
      const parsed = JSON.parse(cfg.config_value);
      return parsed?.normal_draw?.daily_limit || 50;
    } catch {
      return 50;
    }
  }

  private async countTodayDraws(playerId: number): Promise<number> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return this.drawLogRepo
      .createQueryBuilder('log')
      .where('log.player_id = :pid', { pid: playerId })
      .andWhere('log.created_at >= :start', { start: start.toISOString() })
      .getCount();
  }
}
