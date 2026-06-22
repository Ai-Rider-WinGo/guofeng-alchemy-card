import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

/**
 * 玩家账号。独立于 AdminUser（后台运营账号）。
 * 抖音登录对接时：open_id 为抖音平台 UID，username 自动生成或用昵称。
 * 本地注册：username + password_hash。
 */
@Entity('players')
export class Player {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ type: 'varchar', nullable: true })
  password_hash: string | null; // 本地注册用；抖音登录可空

  @Index({ unique: true })
  @Column({ type: 'varchar', nullable: true })
  open_id: string | null; // 抖音/平台 UID

  @Column({ type: 'varchar', length: 100, nullable: true })
  nickname: string | null;

  @Column({ type: 'text', nullable: true })
  avatar_url: string | null;

  @Column({ type: 'integer', default: 0 })
  vip_level: number;

  @Column({ type: 'integer', default: 1 })
  level: number;

  @Column({ type: 'integer', default: 0 })
  exp: number;

  @Column({ type: 'integer', default: 0 })
  coins: number; // 金币（通用货币）

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_banned: boolean;

  /** localStorage 旧存档是否已迁移（防重复） */
  @Column({ type: 'boolean', default: false })
  migration_done: boolean;

  @Column({ type: 'datetime', nullable: true })
  last_login_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
