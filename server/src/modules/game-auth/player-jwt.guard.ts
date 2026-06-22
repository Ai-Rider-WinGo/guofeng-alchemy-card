import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** 玩家鉴权守卫，使用 'jwt-player' 策略。仅玩家 token 可通过。 */
@Injectable()
export class PlayerJwtAuthGuard extends AuthGuard('jwt-player') {
  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('请先登录玩家账号');
    }
    return user;
  }
}
