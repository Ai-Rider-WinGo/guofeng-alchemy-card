import { Entity, PrimaryGeneratedColumn, Column, Unique, UpdateDateColumn } from 'typeorm';

/** 玩家碎片。按碎片键（朝代碎片/稀有度碎片等）累计。 */
@Entity('player_fragments')
@Unique(['player_id', 'shard_key'])
export class PlayerFragment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  player_id: number;

  /** 碎片键，如 dynasty_qin_han / rarity_SSR */
  @Column({ type: 'varchar' })
  shard_key: string;

  @Column({ type: 'integer', default: 0 })
  quantity: number;

  @UpdateDateColumn()
  updated_at: Date;
}
