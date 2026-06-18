import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('game_configs')
export class GameConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  config_key: string;

  @Column({ type: 'text' })
  config_value: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
