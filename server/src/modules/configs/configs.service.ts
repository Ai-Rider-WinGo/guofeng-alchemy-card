import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameConfig } from '../../database/entities/game-config.entity';

@Injectable()
export class ConfigsService {
  constructor(
    @InjectRepository(GameConfig)
    private readonly configRepo: Repository<GameConfig>,
  ) {}

  async findAll(category?: string) {
    const where: any = {};
    if (category) where.category = category;
    return this.configRepo.find({ where, order: { category: 'ASC' } });
  }

  async get(key: string) {
    return this.configRepo.findOne({ where: { config_key: key } });
  }

  async set(key: string, value: string, description?: string, category?: string) {
    let config = await this.configRepo.findOne({ where: { config_key: key } });
    if (config) {
      config.config_value = value;
      if (description) config.description = description;
      if (category) config.category = category;
    } else {
      config = this.configRepo.create({ config_key: key, config_value: value, description, category });
    }
    return this.configRepo.save(config);
  }

  async batchSet(items: { config_key: string; config_value: string; description?: string; category?: string }[]) {
    const results = [];
    for (const item of items) {
      results.push(await this.set(item.config_key, item.config_value, item.description, item.category));
    }
    return results;
  }

  async remove(key: string) {
    const config = await this.configRepo.findOne({ where: { config_key: key } });
    if (!config) return { deleted: false };
    await this.configRepo.remove(config);
    return { deleted: true };
  }
}
