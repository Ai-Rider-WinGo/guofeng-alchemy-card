import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly logRepo: Repository<AuditLog>,
  ) {}

  async findAll(query: { page?: number; limit?: number; target?: string; username?: string }) {
    const { page = 1, limit = 50, target, username } = query;
    const where: any = {};
    if (target) where.target = target;
    if (username) where.username = username;
    const [list, total] = await this.logRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });
    return { list, total, page, limit };
  }
}
