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

export const MERGE_RULES: MergeRule[] = [
  {
    rule_id: 'merge_xingyang_escape_001',
    input_a: 'liubang_002',
    input_b: 'jixin_002',
    output: 'xingyang_escape_004',
    target_level: 4,
    success_rate: 1,
    consume_inputs: true,
    merge_desc: '刘邦被项羽围困荥阳，纪信假扮刘邦出城吸引楚军，使刘邦得以脱身。',
  },
  {
    rule_id: 'merge_julu_battle_001',
    input_a: 'xiangyu_002',
    input_b: 'zhanghan_002',
    output: 'julu_battle_004',
    target_level: 4,
    success_rate: 1,
    consume_inputs: true,
    merge_desc: '项羽与秦将章邯所代表的秦军力量在秦末战争中形成关键对抗，最终导向巨鹿之战的历史转折。',
  },
  {
    rule_id: 'merge_chuhan_conflict_001',
    input_a: 'xingyang_escape_004',
    input_b: 'hongmenyan_004',
    output: 'chuhan_conflict_005',
    target_level: 5,
    success_rate: 1,
    consume_inputs: true,
    merge_desc: '鸿门宴揭示刘邦与项羽的权力裂痕，荥阳脱困体现双方战争拉锯，两者共同指向楚汉相争。',
  },
  {
    rule_id: 'merge_han_dynasty_founding_001',
    input_a: 'chuhan_conflict_005',
    input_b: 'gaixia_siege_004',
    output: 'han_dynasty_founding_005',
    target_level: 5,
    success_rate: 1,
    consume_inputs: true,
    merge_desc: '楚汉相争经过垓下之围走向终局，项羽败亡后刘邦建立汉朝。',
  },
];

export function findMergeRule(cardA: string, cardB: string): MergeRule | undefined {
  return MERGE_RULES.find(
    (r) =>
      (r.input_a === cardA && r.input_b === cardB) ||
      (r.input_a === cardB && r.input_b === cardA)
  );
}
