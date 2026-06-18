import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DrawPool } from '../../database/entities/draw-pool.entity';
import { CreatePoolDto, UpdatePoolDto } from './dto/create-pool.dto';

@Injectable()
export class PoolsService {
  constructor(
    @InjectRepository(DrawPool)
    private readonly poolRepo: Repository<DrawPool>,
  ) {}

  async findAll() {
    return this.poolRepo.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: number) {
    const pool = await this.poolRepo.findOne({ where: { id } });
    if (!pool) throw new NotFoundException('卡池不存在');
    return pool;
  }

  async create(dto: CreatePoolDto) {
    return this.poolRepo.save(this.poolRepo.create(dto));
  }

  async update(id: number, dto: UpdatePoolDto) {
    const pool = await this.findOne(id);
    Object.assign(pool, dto);
    return this.poolRepo.save(pool);
  }

  async remove(id: number) {
    const pool = await this.findOne(id);
    await this.poolRepo.remove(pool);
    return { deleted: true };
  }
}
