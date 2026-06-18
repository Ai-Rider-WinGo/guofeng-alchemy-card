import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PoolType {
  PERMANENT = 'permanent_basic',
  WEEKLY = 'weekly',
  LIMITED = 'limited_premium',
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
  rate_weights: {
    common: number;
    uncommon: number;
    rare: number;
    sr: number;
    ssr: number;
  };

  @Column({ type: 'simple-json' })
  card_ids: string[];

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
