import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('merge_rules')
export class MergeRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  rule_name: string;

  @Column({ type: 'simple-json' })
  input_card_ids: string[];

  @Column()
  output_card_id: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  success_rate: number;

  @Column({ default: true })
  consume_inputs: boolean;

  @Column({ type: 'text', nullable: true })
  story_output: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
