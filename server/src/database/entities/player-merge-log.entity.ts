import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/** 合成流水。记录每次合成的输入、产出、是否成功。 */
@Entity('player_merge_logs')
export class PlayerMergeLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  player_id: number;

  @Column({ type: 'varchar' })
  merge_type: string; // generic | recipe | fragment | lv12

  @Column({ type: 'varchar', nullable: true })
  rule_id: string | null;

  /** JSON：输入卡/碎片等 */
  @Column({ type: 'text' })
  inputs: string;

  /** 产出卡 id（失败则 null） */
  @Column({ type: 'varchar', nullable: true })
  output_card_id: string | null;

  @Column({ type: 'boolean', default: false })
  success: boolean;

  @CreateDateColumn()
  created_at: Date;
}
