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

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const ds = app.get(DataSource);
  const cfgDir = path.join(__dirname, '../../../config');

  // 1. Admin user
  const userRepo = ds.getRepository(AdminUser);
  let admin = await userRepo.findOne({ where: { username: 'admin' } });
  if (!admin) {
    admin = userRepo.create({
      username: 'admin',
      password_hash: await bcrypt.hash('admin123', 10),
      role: AdminRole.SUPER_ADMIN,
      display_name: '超级管理员',
    });
    await userRepo.save(admin);
    console.log('Admin user ready');
  }

  // 2. Cards
  const cf = path.join(cfgDir, 'cards.json');
  if (fs.existsSync(cf)) {
    const cards = JSON.parse(fs.readFileSync(cf, 'utf-8'));
    const repo = ds.getRepository(Card);
    let n = 0;
    for (const c of cards) {
      const ex = await repo.findOne({ where: { card_id: c.card_id } });
      const ent = {
        card_id: c.card_id,
        name: c.name || c.card_id,
        quality: c.quality || c.rarity || 'common',
        dynasty: c.dynasty || '秦汉',
        level: c.level || 1,
        type: c.type || c.card_type || 'character',
        image_url: c.image_url || null,
        story: c.story || c.description || null,
        knowledge_point: c.knowledge_point || null,
        tags: c.tags || [],
        related_cards: c.related_cards || [],
        merge_hint: c.merge_hint || null,
        is_active: c.active !== undefined ? c.active : true,
      };
      if (ex) { Object.assign(ex, ent); await repo.save(ex); }
      else { await repo.save(repo.create(ent)); }
      n++;
    }
    console.log(`Cards: ${n}`);
  }

  // 3. Draw Pools
  const pf = path.join(cfgDir, 'draw_pools.json');
  if (fs.existsSync(pf)) {
    const pools = JSON.parse(fs.readFileSync(pf, 'utf-8'));
    const repo = ds.getRepository(DrawPool);
    let n = 0;
    for (const p of pools) {
      const ex = await repo.findOne({ where: { pool_id: p.pool_id } });
      const ent = {
        pool_id: p.pool_id,
        name: p.name || p.pool_id,
        type: p.pool_type || p.type || 'permanent_basic',
        rate_weights: p.rarity_weights || p.rate_weights || { common: 60, uncommon: 25, rare: 10, sr: 4, ssr: 1 },
        card_ids: p.featured_card_ids || p.card_ids || p.include_card_ids || [],
        rotation_schedule: p.rotation_schedule || null,
        is_active: p.active !== undefined ? p.active : true,
      };
      if (ex) { Object.assign(ex, ent); await repo.save(ex); }
      else { await repo.save(repo.create(ent)); }
      n++;
    }
    console.log(`Pools: ${n}`);
  }

  // 4. Merge Rules
  const mf = path.join(cfgDir, 'merge_rules.json');
  if (fs.existsSync(mf)) {
    const rules = JSON.parse(fs.readFileSync(mf, 'utf-8'));
    const repo = ds.getRepository(MergeRule);
    let n = 0;
    for (const r of rules) {
      const inputs: string[] = r.input_card_ids || [];
      if (r.input_a) inputs.push(r.input_a);
      if (r.input_b) inputs.push(r.input_b);
      const ent = {
        rule_name: r.rule_name || r.rule_id || `rule_${n}`,
        input_card_ids: inputs,
        output_card_id: r.output_card_id || r.output || '',
        success_rate: r.success_rate !== undefined ? r.success_rate : 1.0,
        consume_inputs: r.consume_inputs !== undefined ? r.consume_inputs : true,
        story_output: r.story_output || r.merge_desc || null,
        is_active: true,
      };
      await repo.save(repo.create(ent));
      n++;
    }
    console.log(`Merge Rules: ${n}`);
  }

  // 5. All JSON configs as key-value store
  const configFiles = [
    { file: 'daily_limits.json', cat: 'daily_limits' },
    { file: 'duplicate_conversion_rules.json', cat: 'duplicate_rules' },
    { file: 'dynasty_tags.json', cat: 'dynasties' },
    { file: 'weekly_collection_rewards.json', cat: 'rewards' },
  ];
  const crepo = ds.getRepository(GameConfig);
  let cn = 0;
  for (const { file, cat } of configFiles) {
    const fp = path.join(cfgDir, file);
    if (!fs.existsSync(fp)) continue;
    const data = JSON.parse(fs.readFileSync(fp, 'utf-8'));
    const arr = Array.isArray(data) ? data : [data];
    for (let i = 0; i < arr.length; i++) {
      const key = `${cat}_${i}`;
      const ex = await crepo.findOne({ where: { config_key: key } });
      if (!ex) {
        await crepo.save(crepo.create({
          config_key: key,
          config_value: JSON.stringify(arr[i], null, 2),
          category: cat,
          description: `${file}[${i}]`,
        }));
        cn++;
      }
    }
  }
  console.log(`Configs: ${cn}`);

  await app.close();
  console.log('Seed done!');
}
bootstrap();
