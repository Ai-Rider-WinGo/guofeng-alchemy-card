import type { CardMeta, MergePreview, MergeResult, MergeRule } from '../data/CardTypes';
import { CardManager } from './CardManager';
import { InventoryManager } from './InventoryManager';

function normalizedPair(inputA: string, inputB: string): string {
  return [inputA, inputB].sort().join('+');
}

export class MergeManager {
  private readonly rulesByPair = new Map<string, MergeRule>();

  constructor(
    rules: MergeRule[],
    private readonly cardManager: CardManager,
    private readonly inventoryManager: InventoryManager,
  ) {
    rules.forEach((rule) => {
      this.rulesByPair.set(normalizedPair(rule.input_a, rule.input_b), rule);
    });
  }

  preview(inputA: string, inputB: string): MergePreview {
    const rule = this.rulesByPair.get(normalizedPair(inputA, inputB));

    if (!rule) {
      return { can_merge: false };
    }

    return {
      can_merge: true,
      output: rule.output,
      success_rate: rule.success_rate,
      merge_desc: rule.merge_desc,
    };
  }

  execute(inputA: string, inputB: string): MergeResult {
    const rule = this.rulesByPair.get(normalizedPair(inputA, inputB));
    if (!rule) {
      return {
        success: false,
        message: '没有匹配的历史合成关系',
      };
    }

    if (this.inventoryManager.getQuantity(inputA) < 1 || this.inventoryManager.getQuantity(inputB) < 1) {
      return {
        success: false,
        message: '合成材料不足',
      };
    }

    const outputCard = this.cardManager.getCard(rule.output);
    if (!outputCard) {
      return {
        success: false,
        message: `结果卡不存在：${rule.output}`,
      };
    }

    const success = Math.random() <= rule.success_rate;
    if (!success) {
      return this.createFailureResult(outputCard);
    }

    if (rule.consume_inputs) {
      this.inventoryManager.removeCard(inputA);
      this.inventoryManager.removeCard(inputB);
    }

    this.inventoryManager.addCard(rule.output);

    return {
      success: true,
      output_card: outputCard,
      story: rule.merge_desc,
    };
  }

  private createFailureResult(outputCard: CardMeta): MergeResult {
    return {
      success: false,
      output_card: outputCard,
      message: '合成失败，MVP 阶段暂未开启失败补偿',
    };
  }
}

