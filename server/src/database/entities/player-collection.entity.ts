import { Entity, PrimaryGeneratedColumn, Column, Unique, CreateDateColumn } from 'typeorm';

/** 玩家图鉴（解锁记录）。每解锁一张新卡一行，用于图鉴进度。 */
@Entity('player_collection')
@Unique(['player_id', 'card_id'])
export class PlayerCollection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  player_id: number;

  @Column({ type: 'varchar' })
  card_id: string;

  @CreateDateColumn()
  unlocked_at: Date;
}
