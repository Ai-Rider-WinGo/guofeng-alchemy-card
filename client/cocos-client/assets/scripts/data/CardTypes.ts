export type CardType = 'person' | 'place' | 'event' | 'institution' | 'force' | 'system';

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface CardMeta {
  card_id: string;
  name: string;
  level: number;
  type: CardType;
  dynasty: string;
  rarity: CardRarity;
  tags: string[];
  short_desc: string;
  story: string;
  knowledge_point: string;
  related_cards: string[];
  merge_hint: string;
  image: string;
  image_prompt_keywords?: string;
  reference_source?: string;
  review_status?: 'draft' | 'reviewed' | 'approved';
}

export interface MergeRule {
  rule_id: string;
  input_a: string;
  input_b: string;
  output: string;
  target_level: number;
  success_rate: number;
  consume_inputs: boolean;
  merge_desc: string;
}

export interface DrawPool {
  pool_id: string;
  name: string;
  levels: number[];
  rarity_weights: Partial<Record<CardRarity, number>>;
  active_card_ids: string[];
}

export interface DailyLimits {
  login_free_draws: number;
  share_bonus_draws: number;
  ad_bonus_draws_per_view: number;
  max_ad_views_per_day: number;
  max_total_daily_draws: number;
}

export interface InventoryItem {
  card_id: string;
  star: number;
  quantity: number;
  locked?: boolean;
}

export interface DrawCardResult {
  card_id: string;
  is_new: boolean;
  quantity: number;
}

export interface DrawResult {
  pool_id: string;
  cards: DrawCardResult[];
  remaining_draws: number;
}

export interface MergePreview {
  can_merge: boolean;
  output?: string;
  success_rate?: number;
  merge_desc?: string;
}

export interface MergeResult {
  success: boolean;
  output_card?: CardMeta;
  story?: string;
  message?: string;
}

export interface CollectionProgress {
  total: number;
  unlocked: number;
  percent: number;
}

