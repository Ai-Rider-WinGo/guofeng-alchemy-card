import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PoolType {
  PERMANENT = 'permanent',
  WEEKLY_DYNASTY = 'weekly_dynasty',
  LIMITED_PREMIUM = 'limited_premium',
}

@Entity('draw_pools')
export class DrawPool {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  pool_id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: PoolType.PERMANENT })
  type: PoolType;

  @Column({ type: 'simple-json' })
  rarity_weights: Record<string, number>;

  @Column({ type: 'simple-json' })
  featured_card_ids: string[];

  @Column({ nullable: true })
  dynasty_tag: string;

  @Column({ nullable: true })
  ticket_type: string;

  @Column({ type: 'simple-json', nullable: true })
  pity_config: {
    sr_every: number;
    ssr_every: number;
    ssr_hard_pity: number;
    description: string;
  };

  @Column({ nullable: true })
  collection_target: number;

  @Column({ type: 'simple-json', nullable: true })
  rotation_schedule: {
    dynasty: string;
    start_date: string;
    end_date: string;
    interval_weeks: number;
  };

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
