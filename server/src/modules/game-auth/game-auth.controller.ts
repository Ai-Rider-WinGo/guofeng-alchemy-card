import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GameAuthService } from './game-auth.service';
import { PlayerJwtAuthGuard } from './player-jwt.guard';
import { RegisterDto, LoginDto, DouyinLoginDto } from './dto/game-auth.dto';

@ApiTags('玩家账号')
@Controller('game/auth')
export class GameAuthController {
  constructor(private readonly service: GameAuthService) {}

  @Post('register')
  @ApiOperation({ summary: '玩家注册（用户名+密码）' })
  register(@Body() dto: RegisterDto) {
    return this.service.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: '玩家登录（用户名+密码）' })
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }

  @Post('douyin-login')
  @ApiOperation({ summary: '抖音登录（code 换 open_id，当前 stub）' })
  douyinLogin(@Body() dto: DouyinLoginDto) {
    return this.service.douyinLogin(dto.code, dto.nickname);
  }

  @Get('profile')
  @ApiBearerAuth()
  @UseGuards(PlayerJwtAuthGuard)
  @ApiOperation({ summary: '获取玩家资料' })
  profile(@Req() req: any) {
    return this.service.getProfile(req.user.id);
  }
}
