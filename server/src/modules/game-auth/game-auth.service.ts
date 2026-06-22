import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Player } from '../../database/entities/player.entity';
import { RegisterDto, LoginDto } from './dto/game-auth.dto';

@Injectable()
export class GameAuthService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepo: Repository<Player>,
    private readonly jwtService: JwtService,
  ) {}

  /** 本地注册（用户名+密码） */
  async register(dto: RegisterDto) {
    const existing = await this.playerRepo.findOne({ where: { username: dto.username } });
    if (existing) throw new ConflictException('用户名已存在');

    const password_hash = await bcrypt.hash(dto.password, 10);
    const player = this.playerRepo.create({
      username: dto.username,
      password_hash,
      nickname: dto.nickname || dto.username,
    });
    const saved = await this.playerRepo.save(player);
    return this.toAuthResult(saved);
  }

  /** 本地登录（用户名+密码） */
  async login(dto: LoginDto) {
    const player = await this.playerRepo.findOne({ where: { username: dto.username } });
    if (!player || !player.password_hash) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    if (player.is_banned) throw new UnauthorizedException('账号已被封禁');
    if (!player.is_active) throw new UnauthorizedException('账号已停用');

    const ok = await bcrypt.compare(dto.password, player.password_hash);
    if (!ok) throw new UnauthorizedException('用户名或密码错误');

    player.last_login_at = new Date();
    await this.playerRepo.save(player);
    return this.toAuthResult(player);
  }

  /**
   * 抖音登录（预留）。
   * 正式对接需用 code 换 open_id（抖音开放平台 login API）。
   * 当前 stub：以 code 当作临时 open_id，首次登录自动建号。
   * 接入真实 SDK 后替换 exchangeOpenId 实现。
   */
  async douyinLogin(code: string, nickname?: string) {
    const openId = await this.exchangeOpenId(code); // TODO: 接真实抖音 API
    let player = await this.playerRepo.findOne({ where: { open_id: openId } });
    if (!player) {
      player = this.playerRepo.create({
        username: 'dy_' + openId.slice(-8),
        open_id: openId,
        nickname: nickname || '抖音玩家',
        password_hash: null,
      });
      player = await this.playerRepo.save(player);
    }
    if (player.is_banned) throw new UnauthorizedException('账号已被封禁');
    player.last_login_at = new Date();
    await this.playerRepo.save(player);
    return this.toAuthResult(player);
  }

  /** 占位：用 code 换抖音 open_id。接入 SDK 后实现。 */
  private async exchangeOpenId(code: string): Promise<string> {
    // TODO: 调用 https://developer.toutiao.com/api/apps/v2/jscode2session
    // 当前返回 code 本身作为临时标识，仅供联调
    return 'stub_' + code;
  }

  async getProfile(playerId: number) {
    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) throw new NotFoundException('玩家不存在');
    return player;
  }

  private signToken(player: Player): string {
    const payload = { sub: player.id, username: player.username, kind: 'player' };
    return this.jwtService.sign(payload);
  }

  private toAuthResult(player: Player) {
    return {
      token: this.signToken(player),
      player: {
        id: player.id,
        username: player.username,
        nickname: player.nickname,
        avatar_url: player.avatar_url,
        level: player.level,
        coins: player.coins,
      },
    };
  }
}
