import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AdminUser, AdminRole } from '../database/entities/admin-user.entity';
import { Card, CardRarity, CardType, MergePath } from '../database/entities/card.entity';
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

  // 2. Cards — from import_cards.json (139 cards) + config/cards.json (canonical 12)
  const qualityToRarity: Record<string, string> = {
    common: 'N', n: 'N',
    uncommon: 'R', r: 'R',
    rare: 'SR', sr: 'SR',
    epic: 'SSR', ssr: 'SSR',
    legendary: 'UR', treasure: 'UR', ur: 'UR',
  };
  const cnTypeToEn: Record<string, string> = {
    '人物': 'person', '事件': 'event', '兵器': 'weapon',
    '典籍': 'classic', '地点': 'place', '朝代': 'dynasty',
  };
  const dynastyTagMap: Record<string, string> = {
    '秦汉': 'qin_han', '两晋': 'jin', '三国': 'three_kingdoms',
    '隋唐': 'tang', '宋元': 'song', '明清': 'ming',
    '春秋战国': 'spring_autumn_warring_states', '春秋': 'spring_autumn_warring_states',
  };

  const cardFiles = [
    { path: path.join(cfgDir, '..', 'import_cards.json'), label: 'import_cards.json' },
    { path: path.join(cfgDir, 'cards.json'), label: 'cards.json' },
  ];
  let totalCards = 0;
  const cardRepo = ds.getRepository(Card);

  for (const { path: cf, label } of cardFiles) {
    if (!fs.existsSync(cf)) { console.log(`  skip ${label} (not found)`); continue; }
    const cards = JSON.parse(fs.readFileSync(cf, 'utf-8'));
    for (const c of cards) {
      const ex = await cardRepo.findOne({ where: { card_id: c.card_id } });
      // field mapping
      const rawRarity = (c.rarity || c.quality || 'N').toString().toLowerCase();
      const rawType = (c.type || 'person').toString();
      const rawDynasty = c.dynasty || '未知';

      const ent = {
        card_id: c.card_id,
        name: c.name || c.card_id,
        rarity: (qualityToRarity[rawRarity] || 'N') as CardRarity,
        dynasty: rawDynasty,
        dynasty_tag: c.dynasty_tag || dynastyTagMap[rawDynasty] || null,
        level: c.level || 1,
        type: (cnTypeToEn[rawType] || rawType || 'person') as CardType,
        short_desc: c.short_desc || null,
        story: c.story || null,
        knowledge_point: c.knowledge_point || null,
        tags: c.tags || [],
        related_cards: c.related_cards || [],
        merge_paths: (c.merge_paths || []) as MergePath[],
        star_max: c.star_max || 3,
        image_url: c.image_url || c.image || null,
        thumbnail_url: c.thumbnail_url || c.thumbnail || null,
        is_active: c.is_active !== undefined ? c.is_active : true,
      };
      if (ex) { Object.assign(ex, ent); await cardRepo.save(ex); }
      else { await cardRepo.save(cardRepo.create(ent)); }
      totalCards++;
    }
  }
  console.log(`Cards: ${totalCards}`);

  // 3. Draw Pools — from config/draw_pools.json
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
        type: p.pool_type || p.type || 'permanent',
        rarity_weights: p.rarity_weights || { N: 60, R: 25, SR: 10, SSR: 4, UR: 1 },
        featured_card_ids: p.featured_card_ids || [],
        dynasty_tag: p.dynasty_tag || null,
        ticket_type: p.ticket_type || 'normal_ticket',
        pity_config: p.pity_config || null,
        collection_target: p.collection_target || null,
        rotation_schedule: p.rotation_schedule || null,
        is_active: p.active !== undefined ? p.active : true,
      };
      if (ex) { Object.assign(ex, ent); await repo.save(ex); }
      else { await repo.save(repo.create(ent)); }
      n++;
    }
    console.log(`Pools: ${n}`);
  }

  // 4. Merge Rules — from config/merge_rules.json
  const mf = path.join(cfgDir, 'merge_rules.json');
  if (fs.existsSync(mf)) {
    const rules = JSON.parse(fs.readFileSync(mf, 'utf-8'));
    const repo = ds.getRepository(MergeRule);
    let n = 0;
    for (const r of rules) {
      // config uses input_a/input_b/output, entity uses same names
      const ent = {
        rule_id: r.rule_id || `rule_${n}`,
        rule_name: r.rule_name || r.rule_id || `合成规则_${n}`,
        input_a: r.input_a || '',
        input_b: r.input_b || '',
        output_card_id: r.output_card_id || r.output || '',
        target_level: r.target_level || null,
        success_rate: r.success_rate !== undefined ? r.success_rate : 1.0,
        consume_inputs: r.consume_inputs !== undefined ? r.consume_inputs : true,
        require_owned: r.require_owned !== undefined ? r.require_owned : true,
        merge_desc: r.merge_desc || null,
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
