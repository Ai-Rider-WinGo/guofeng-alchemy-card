import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MergeRule } from '../../database/entities/merge-rule.entity';
import { CreateMergeRuleDto, UpdateMergeRuleDto } from '../pools/dto/create-pool.dto';

@Injectable()
export class MergeRulesService {
  constructor(
    @InjectRepository(MergeRule)
    private readonly ruleRepo: Repository<MergeRule>,
  ) {}

  async findAll() {
    return this.ruleRepo.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: number) {
    const rule = await this.ruleRepo.findOne({ where: { id } });
    if (!rule) throw new NotFoundException('合成规则不存在');
    return rule;
  }

  async create(dto: CreateMergeRuleDto) {
    return this.ruleRepo.save(this.ruleRepo.create(dto));
  }

  async update(id: number, dto: UpdateMergeRuleDto) {
    const rule = await this.findOne(id);
    Object.assign(rule, dto);
    return this.ruleRepo.save(rule);
  }

  async remove(id: number) {
    const rule = await this.findOne(id);
    await this.ruleRepo.remove(rule);
    return { deleted: true };
  }
}
