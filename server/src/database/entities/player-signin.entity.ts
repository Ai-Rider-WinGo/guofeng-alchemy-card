import { Entity, PrimaryGeneratedColumn, Column, Unique, CreateDateColumn } from 'typeorm';

/** 玩家每日签到记录。一天一行，用于累计签到天数 + 防重复。 */
@Entity('player_signin')
@Unique(['player_id', 'signin_date'])
export class PlayerSignin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  player_id: number;

  /** 签到日期 YYYY-MM-DD */
  @Column({ type: 'varchar' })
  signin_date: string;

  /** 连续签到天数 */
  @Column({ type: 'integer', default: 1 })
  streak: number;

  @CreateDateColumn()
  created_at: Date;
}
