import { JsonAsset, resources } from 'cc';
import type { CardMeta, DailyLimits, DrawPool, MergeRule } from '../data/CardTypes';

export interface GameConfig {
  cards: CardMeta[];
  mergeRules: MergeRule[];
  drawPools: DrawPool[];
  dailyLimits: DailyLimits;
}

function loadJson<T>(path: string): Promise<T> {
  return new Promise((resolve, reject) => {
    resources.load(path, JsonAsset, (error, asset) => {
      if (error || !asset) {
        reject(error ?? new Error(`Config not found: ${path}`));
        return;
      }

      resolve(asset.json as T);
    });
  });
}

export class ConfigLoader {
  static async loadGameConfig(): Promise<GameConfig> {
    const [cards, mergeRules, drawPools, dailyLimits] = await Promise.all([
      loadJson<CardMeta[]>('config/cards'),
      loadJson<MergeRule[]>('config/merge_rules'),
      loadJson<DrawPool[]>('config/draw_pools'),
      loadJson<DailyLimits>('config/daily_limits'),
    ]);

    return {
      cards,
      mergeRules,
      drawPools,
      dailyLimits,
    };
  }
}

