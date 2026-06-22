import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/** 抽卡流水。每次抽卡一行，用于保底计算 + 运营统计。 */
@Entity('player_draw_logs')
export class PlayerDrawLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  player_id: number;

  @Column({ type: 'varchar' })
  pool_id: string;

  @Column({ type: 'varchar' })
  card_id: string;

  @Column({ type: 'varchar' })
  rarity: string;

  @CreateDateColumn()
  created_at: Date;
}
