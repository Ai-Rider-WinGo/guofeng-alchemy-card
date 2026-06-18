import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('merge_rules')
export class MergeRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  rule_id: string;

  @Column()
  rule_name: string;

  @Column()
  input_a: string;

  @Column()
  input_b: string;

  @Column()
  output_card_id: string;

  @Column({ nullable: true })
  target_level: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  success_rate: number;

  @Column({ default: true })
  consume_inputs: boolean;

  @Column({ default: true })
  require_owned: boolean;

  @Column({ type: 'text', nullable: true })
  merge_desc: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
