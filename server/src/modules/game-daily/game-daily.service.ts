import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PlayerSignin } from '../../database/entities/player-signin.entity';
import { Player } from '../../database/entities/player.entity';

// 默认 7 天签到奖励（configs 无 signin_rewards 时用此表）
const DEFAULT_SIGNIN_REWARDS = [
  { day: 1, rewards: [{ type: 'coins', amount: 100 }] },
  { day: 2, rewards: [{ type: 'coins', amount: 150 }] },
  { day: 3, rewards: [{ type: 'normal_ticket', amount: 1 }] },
  { day: 4, rewards: [{ type: 'coins', amount: 200 }] },
  { day: 5, rewards: [{ type: 'coins', amount: 300 }] },
  { day: 6, rewards: [{ type: 'normal_ticket', amount: 2 }] },
  { day: 7, rewards: [{ type: 'coins', amount: 500 }, { type: 'normal_ticket', amount: 3 }] },
];

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function yesterdayStr(): string {
  const d = new Date(Date.now() - 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

@Injectable()
export class GameDailyService {
  constructor(
    @InjectRepository(PlayerSignin) private readonly signinRepo: Repository<PlayerSignin>,
    @InjectRepository(Player) private readonly playerRepo: Repository<Player>,
    private readonly dataSource: DataSource,
  ) {}

  /** 签到状态 */
  async getStatus(playerId: number) {
    const today = todayStr();
    const signedToday = !!(await this.signinRepo.findOne({ where: { player_id: playerId, signin_date: today } }));
    const yest = await this.signinRepo.findOne({ where: { player_id: playerId, signin_date: yesterdayStr() }, order: { id: 'DESC' } });
    const streak = signedToday ? (await this.signinRepo.findOne({ where: { player_id: playerId, signin_date: today } }))?.streak || 0
      : (yest ? yest.streak : 0);
    // 累计签到天数
    const totalDays = await this.signinRepo.count({ where: { player_id: playerId } });
    return {
      today: today,
      signed_today: signedToday,
      streak,
      total_days: totalDays,
      rewards_table: DEFAULT_SIGNIN_REWARDS,
    };
  }

  /** 执行签到 */
  async signin(playerId: number) {
    const today = todayStr();
    const exist = await this.signinRepo.findOne({ where: { player_id: playerId, signin_date: today } });
    if (exist) throw new BadRequestException('今日已签到');

    // 连续天数：若昨日签了则 +1，否则重置为 1
    const yest = await this.signinRepo.findOne({ where: { player_id: playerId, signin_date: yesterdayStr() }, order: { id: 'DESC' } });
    const streak = yest ? yest.streak + 1 : 1;

    // 奖励：按 streak 取对应天数（>7 取模）
    const rewardIdx = ((streak - 1) % 7);
    const reward = DEFAULT_SIGNIN_REWARDS[rewardIdx];

    // 事务：写签到 + 发奖励（金币入玩家表）
    await this.dataSource.transaction(async (manager) => {
      const signinRepo = manager.getRepository(PlayerSignin);
      await signinRepo.save(signinRepo.create({ player_id: playerId, signin_date: today, streak }));

      // 发金币（抽卡券暂记录到 player.coins 或单独表，这里金币直接入 player.coins）
      const playerRepo = manager.getRepository(Player);
      const player = await playerRepo.findOne({ where: { id: playerId } });
      if (player) {
        for (const r of reward.rewards) {
          if (r.type === 'coins') player.coins += r.amount;
        }
        await playerRepo.save(player);
      }
    });

    return {
      success: true,
      signin_date: today,
      streak,
      rewards: reward.rewards,
      rewards_table: DEFAULT_SIGNIN_REWARDS,
    };
  }

  /** 玩家信息（含金币，供前端展示） */
  async getPlayerInfo(playerId: number) {
    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) throw new BadRequestException('玩家不存在');
    return {
      id: player.id,
      username: player.username,
      nickname: player.nickname,
      avatar_url: player.avatar_url,
      level: player.level,
      exp: player.exp,
      coins: player.coins,
      vip_level: player.vip_level,
    };
  }
}
