import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImageJob } from '../../database/entities/image-job.entity';
import { Card } from '../../database/entities/card.entity';

@Injectable()
export class ImageJobsService {
  constructor(
    @InjectRepository(ImageJob)
    private readonly jobRepo: Repository<ImageJob>,
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
  ) {}

  /** 触发卡牌图片重生任务（占位：仅记录，状态 pending） */
  async regenerate(cardId: string, prompt?: string, triggeredBy?: number) {
    const card = await this.cardRepo.findOne({ where: { card_id: cardId } });
    if (!card) throw new NotFoundException('卡牌不存在: ' + cardId);

    // 基于卡牌元数据生成默认 prompt（ComfyUI 稳定前的占位文案）
    const autoPrompt =
      prompt ||
      `${card.dynasty} · ${card.name} · ${card.type} · ${card.rarity} · ${card.short_desc || ''}`;

    const job = this.jobRepo.create({
      card_id: cardId,
      job_type: 'regenerate',
      status: 'pending',
      prompt: autoPrompt,
      triggered_by: triggeredBy || null,
    });
    return this.jobRepo.save(job);
  }

  findAll(cardId?: string) {
    const where: any = {};
    if (cardId) where.card_id = cardId;
    return this.jobRepo.find({ where, order: { created_at: 'DESC' }, take: 200 });
  }

  findOne(id: number) {
    return this.jobRepo.findOne({ where: { id } });
  }

  /** 更新任务状态（供后续 ComfyUI worker 回调） */
  async updateStatus(id: number, status: string, resultUrl?: string, error?: string) {
    const job = await this.findOne(id);
    if (!job) throw new NotFoundException('任务不存在');
    job.status = status;
    if (resultUrl) job.result_url = resultUrl;
    if (error) job.error = error;
    return this.jobRepo.save(job);
  }
}
