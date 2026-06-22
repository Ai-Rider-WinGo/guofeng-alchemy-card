import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from '../../database/entities/player.entity';

/**
 * 玩家 JWT 策略（passport strategy 名 'jwt-player'）。
 * 与 admin 的 JwtStrategy（默认 'jwt'）完全分离，互不影响。
 * 校验 token 的 kind 必须为 'player'，且玩家未被封禁。
 */
@Injectable()
export class PlayerJwtStrategy extends PassportStrategy(Strategy, 'jwt-player') {
  constructor(
    config: ConfigService,
    @InjectRepository(Player)
    private readonly playerRepo: Repository<Player>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET', 'dev-secret'),
    });
  }

  async validate(payload: any) {
    if (payload.kind !== 'player') {
      throw new UnauthorizedException('无效的玩家凭证');
    }
    const player = await this.playerRepo.findOne({ where: { id: payload.sub } });
    if (!player || player.is_banned || !player.is_active) {
      throw new UnauthorizedException('账号不可用');
    }
    return { id: player.id, username: player.username, kind: 'player', player };
  }
}
