import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Card } from '../../database/entities/card.entity';
import { MergeRule } from '../../database/entities/merge-rule.entity';
import { PlayerInventory } from '../../database/entities/player-inventory.entity';
import { PlayerFragment } from '../../database/entities/player-fragment.entity';
import { PlayerCollection } from '../../database/entities/player-collection.entity';
import { PlayerMergeLog } from '../../database/entities/player-merge-log.entity';

// ============ 规则常量（与前端 types.ts 对齐） ============
function getSuccessRate(level: number): number {
  if (level <= 5) return 1.0;
  if (level <= 8) return 0.8;
  if (level <= 11) return 0.6;
  return 0;
}
function getFragmentCost(level: number): number {
  const table: Record<number, number> = { 1: 5, 2: 10, 3: 15, 4: 30, 5: 50, 6: 80, 7: 120, 8: 180, 9: 250, 10: 350, 11: 500, 12: 800 };
  return table[level] ?? 800;
}

@Injectable()
export class GameMergeService {
  constructor(
    @InjectRepository(Card) private readonly cardRepo: Repository<Card>,
    @InjectRepository(MergeRule) private readonly ruleRepo: Repository<MergeRule>,
    private readonly dataSource: DataSource,
  ) {}

  /** 通用合成：同朝代同等级两张卡 → 概率升阶一张高一阶的卡 */
  async generic(playerId: number, card1Id: string, card2Id: string) {
    const c1 = await this.getCard(card1Id);
    const c2 = await this.getCard(card2Id);
    if (!c1 || !c2) throw new NotFoundException('卡牌不存在');
    if (c1.level !== c2.level || c1.dynasty_tag !== c2.dynasty_tag) {
      throw new BadRequestException('需同朝代同等级卡');
    }
    if (c1.level >= 12) throw new BadRequestException('已达最高等级');

    return this.dataSource.transaction(async (manager) => {
      const invRepo = manager.getRepository(PlayerInventory);
      // 校验持有
      const i1 = await this.requireCard(invRepo, playerId, card1Id);
      const i2 = await this.requireCard(invRepo, playerId, card2Id);

      const rate = getSuccessRate(c1.level);
      const roll = Math.random();
      const success = roll < rate;

      if (!success) {
        // 失败：不消耗输入卡，仅记录流水
        await this.log(manager, playerId, 'generic', null, [card1Id, card2Id], null, false);
        return { success: false, error: '合成失败', rate };
      }
      // 成功：先消耗两张输入卡，再发放结果
      await this.consumeCard(invRepo, i1);
      await this.consumeCard(invRepo, i2);

      // 从同朝代 level+1 卡中随机一张
      const candidates = await this.cardRepo.find({ where: { dynasty_tag: c1.dynasty_tag, level: c1.level + 1, is_active: true } });
      if (candidates.length === 0) {
        await this.log(manager, playerId, 'generic', null, [card1Id, card2Id], null, false);
        return { success: false, error: '无可用目标卡', rate };
      }
      const out = candidates[Math.floor(Math.random() * candidates.length)];
      await this.grantCard(manager, playerId, out.card_id);
      await this.unlockCollection(manager, playerId, out.card_id);
      await this.log(manager, playerId, 'generic', null, [card1Id, card2Id], out.card_id, true);
      return { success: true, result_card_id: out.card_id, name: out.name, rate };
    });
  }

  /** 配方合成：按 merge_rules 表规则 */
  async recipe(playerId: number, ruleId: string) {
    const rule = await this.ruleRepo.findOne({ where: { rule_id: ruleId, is_active: true } });
    if (!rule) throw new NotFoundException('合成规则不存在');

    return this.dataSource.transaction(async (manager) => {
      const invRepo = manager.getRepository(PlayerInventory);
      const i1 = await this.requireCard(invRepo, playerId, rule.input_a);
      const i2 = await this.requireCard(invRepo, playerId, rule.input_b);
      // 成功率判定
      const success = rule.success_rate >= 1 || Math.random() < rule.success_rate;
      if (rule.consume_inputs) {
        await this.consumeCard(invRepo, i1);
        await this.consumeCard(invRepo, i2);
      }
      if (!success) {
        await this.log(manager, playerId, 'recipe', rule.rule_id, [rule.input_a, rule.input_b], null, false);
        return { success: false, error: '合成失败', rate: rule.success_rate };
      }
      await this.grantCard(manager, playerId, rule.output_card_id);
      await this.unlockCollection(manager, playerId, rule.output_card_id);
      await this.log(manager, playerId, 'recipe', rule.rule_id, [rule.input_a, rule.input_b], rule.output_card_id, true);
      const out = await this.getCard(rule.output_card_id);
      return { success: true, result_card_id: rule.output_card_id, name: out?.name, rate: rule.success_rate };
    });
  }

  /** 碎片兑换：消耗碎片换指定卡 */
  async fragmentExchange(playerId: number, targetCardId: string, shardKey: string) {
    const card = await this.getCard(targetCardId);
    if (!card) throw new NotFoundException('目标卡不存在');
    const cost = getFragmentCost(card.level);

    return this.dataSource.transaction(async (manager) => {
      const fragRepo = manager.getRepository(PlayerFragment);
      const frag = await fragRepo.findOne({ where: { player_id: playerId, shard_key: shardKey } });
      if (!frag || frag.quantity < cost) throw new BadRequestException('碎片不足');
      frag.quantity -= cost;
      await fragRepo.save(frag);
      await this.grantCard(manager, playerId, targetCardId);
      await this.unlockCollection(manager, playerId, targetCardId);
      await this.log(manager, playerId, 'fragment', null, [{ shard: shardKey, cost }], targetCardId, true);
      return { success: true, result_card_id: targetCardId, name: card.name, fragment_cost: cost };
    });
  }

  /** Lv12 合成：6 张 Lv11 → Lv12（规则暂用固定：6张同级朝代卡合成一张同朝代Lv12） */
  async lv12(playerId: number, cardIds: string[]) {
    if (cardIds.length !== 6) throw new BadRequestException('需 6 张 Lv11 卡');
    return this.dataSource.transaction(async (manager) => {
      const invRepo = manager.getRepository(PlayerInventory);
      // 校验 6 张都是 Lv11
      const cards: Card[] = [];
      for (const id of cardIds) {
        const c = await this.getCard(id);
        if (!c || c.level !== 11) throw new BadRequestException(id + ' 不是 Lv11 卡');
        await this.requireCard(invRepo, playerId, id);
        cards.push(c);
      }
      const dynasty = cards[0].dynasty_tag;
      if (!cards.every((c) => c.dynasty_tag === dynasty)) throw new BadRequestException('需同朝代 Lv11 卡');
      // 扣除
      for (const id of cardIds) {
        const inv = await invRepo.findOne({ where: { player_id: playerId, card_id: id } });
        if (inv) await this.consumeCard(invRepo, inv);
      }
      // 产出同朝代 Lv12 卡
      const out = await this.cardRepo.findOne({ where: { dynasty_tag: dynasty, level: 12, is_active: true } });
      if (!out) {
        await this.log(manager, playerId, 'lv12', null, cardIds, null, false);
        return { success: false, error: '该朝代暂无 Lv12 卡' };
      }
      await this.grantCard(manager, playerId, out.card_id);
      await this.unlockCollection(manager, playerId, out.card_id);
      await this.log(manager, playerId, 'lv12', null, cardIds, out.card_id, true);
      return { success: true, result_card_id: out.card_id, name: out.name };
    });
  }

  // ============ 辅助 ============
  private async getCard(cardId: string) {
    return this.cardRepo.findOne({ where: { card_id: cardId } });
  }
  private async requireCard(invRepo: Repository<PlayerInventory>, playerId: number, cardId: string) {
    const inv = await invRepo.findOne({ where: { player_id: playerId, card_id: cardId } });
    if (!inv || inv.quantity < 1) throw new BadRequestException('未持有卡: ' + cardId);
    return inv;
  }
  private async consumeCard(invRepo: Repository<PlayerInventory>, inv: PlayerInventory) {
    inv.quantity -= 1;
    if (inv.quantity <= 0) await invRepo.remove(inv);
    else await invRepo.save(inv);
  }
  private async grantCard(manager: any, playerId: number, cardId: string) {
    const invRepo = manager.getRepository(PlayerInventory);
    let inv = await invRepo.findOne({ where: { player_id: playerId, card_id: cardId } });
    if (inv) { inv.quantity += 1; await invRepo.save(inv); }
    else await invRepo.save(invRepo.create({ player_id: playerId, card_id: cardId, quantity: 1, star_level: 1 }));
  }
  private async unlockCollection(manager: any, playerId: number, cardId: string) {
    const colRepo = manager.getRepository(PlayerCollection);
    const exist = await colRepo.findOne({ where: { player_id: playerId, card_id: cardId } });
    if (!exist) await colRepo.save(colRepo.create({ player_id: playerId, card_id: cardId }));
  }
  private async log(manager: any, playerId: number, type: string, ruleId: string | null, inputs: any, out: string | null, success: boolean) {
    const logRepo = manager.getRepository(PlayerMergeLog);
    await logRepo.save(logRepo.create({
      player_id: playerId, merge_type: type, rule_id: ruleId,
      inputs: JSON.stringify(inputs), output_card_id: out, success,
    }));
  }
}
