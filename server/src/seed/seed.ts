import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AdminUser, AdminRole } from '../database/entities/admin-user.entity';
import { Card } from '../database/entities/card.entity';
import { DrawPool } from '../database/entities/draw-pool.entity';
import { MergeRule } from '../database/entities/merge-rule.entity';
import { GameConfig } from '../database/entities/game-config.entity';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

async function importJsonConfigs(dataSource: DataSource) {
  const configDir = path.join(__dirname, '../../../config');
  if (!fs.existsSync(configDir)) {
    console.log('No config directory found, skipping JSON import');
    return;
  }

  // Import cards
  const cardsPath = path.join(configDir, 'cards.json');
  if (fs.existsSync(cardsPath)) {
    const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf-8'));
    const cardsRepo = dataSource.getRepository(Card);
    for (const card of cards) {
      const existing = await cardsRepo.findOne({ where: { card_id: card.card_id } });
      if (!existing) await cardsRepo.save(cardsRepo.create(card));
      else {
        Object.assign(existing, card);
        await cardsRepo.save(existing);
      }
    }
    console.log(`Imported ${cards.length} cards`);
  }

  // Import draw pools
  const poolsPath = path.join(configDir, 'draw_pools.json');
  if (fs.existsSync(poolsPath)) {
    const pools = JSON.parse(fs.readFileSync(poolsPath, 'utf-8'));
    const poolsRepo = dataSource.getRepository(DrawPool);
    for (const pool of pools) {
      const existing = await poolsRepo.findOne({ where: { pool_id: pool.pool_id } });
      if (!existing) await poolsRepo.save(poolsRepo.create(pool));
      else {
        Object.assign(existing, pool);
        await poolsRepo.save(existing);
      }
    }
    console.log(`Imported ${pools.length} draw pools`);
  }

  // Import merge rules
  const rulesPath = path.join(configDir, 'merge_rules.json');
  if (fs.existsSync(rulesPath)) {
    const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
    const rulesRepo = dataSource.getRepository(MergeRule);
    for (const rule of rules) {
      await rulesRepo.save(rulesRepo.create(rule));
    }
    console.log(`Imported ${rules.length} merge rules`);
  }

  // Import daily limits as game configs
  const limitsPath = path.join(configDir, 'daily_limits.json');
  if (fs.existsSync(limitsPath)) {
    const limits = JSON.parse(fs.readFileSync(limitsPath, 'utf-8'));
    const configRepo = dataSource.getRepository(GameConfig);
    for (const [key, value] of Object.entries(limits)) {
      const existing = await configRepo.findOne({ where: { config_key: key } });
      if (!existing) {
        await configRepo.save(configRepo.create({
          config_key: key,
          config_value: JSON.stringify(value),
          category: 'daily_limits',
        }));
      }
    }
    console.log('Imported daily limits configs');
  }
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const repo = dataSource.getRepository(AdminUser);

  const existing = await repo.findOne({ where: { username: 'admin' } });
  if (!existing) {
    const hash = await bcrypt.hash('admin123', 10);
    await repo.save({
      username: 'admin',
      password_hash: hash,
      role: AdminRole.SUPER_ADMIN,
      display_name: '超级管理员',
    });
    console.log('Seed admin user created: admin / admin123');
  } else {
    console.log('Admin user already exists');
  }

  await importJsonConfigs(dataSource);

  await app.close();
  console.log('Seed complete');
}
bootstrap();
