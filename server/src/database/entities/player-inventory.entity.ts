import { Entity, PrimaryGeneratedColumn, Column, Unique, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/** 玩家持有卡牌（背包）。一张卡一行，quantity 记持有数。 */
@Entity('player_inventory')
@Unique(['player_id', 'card_id'])
export class PlayerInventory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  player_id: number;

  @Column({ type: 'varchar' })
  card_id: string;

  @Column({ type: 'integer', default: 1 })
  quantity: number;

  @Column({ type: 'integer', default: 1 })
  star_level: number;

  @CreateDateColumn()
  obtained_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
