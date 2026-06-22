import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET', 'dev-secret'),
    });
  }

  async validate(payload: any) {
    // 安全隔离：拒绝玩家 token（kind === 'player'）访问 admin 路由。
    // 旧 admin token 无 kind 字段，视为 admin 放行；新 admin token kind='admin'。
    if (payload.kind === 'player') {
      throw new UnauthorizedException('无权访问后台接口');
    }
    return { id: payload.sub, username: payload.username, role: payload.role };
  }
}
