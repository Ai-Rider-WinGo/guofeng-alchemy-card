import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * 卡牌图片生成/重生任务。
 * 当前为占位实现（ComfyUI 管线稳定前）：记录任务，状态 pending。
 * 后续接入 ComfyUI 后，worker 轮询 pending 任务执行出图，回写 result_url。
 */
@Entity('image_jobs')
export class ImageJob {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  card_id: string;

  @Column({ default: 'regenerate' })
  job_type: string; // regenerate | initial

  @Column({ type: 'varchar', default: 'pending' })
  status: string; // pending | processing | done | failed

  @Column({ type: 'text', nullable: true })
  prompt: string | null;

  @Column({ type: 'text', nullable: true })
  result_url: string | null;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @Column({ type: 'integer', nullable: true })
  triggered_by: number | null; // admin user id

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
