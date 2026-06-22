import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GameDailyService } from './game-daily.service';
import { PlayerJwtAuthGuard } from '../game-auth/player-jwt.guard';

@ApiTags('玩家·签到/日常')
@ApiBearerAuth()
@UseGuards(PlayerJwtAuthGuard)
@Controller('game/daily')
export class GameDailyController {
  constructor(private readonly service: GameDailyService) {}

  @Get('signin/status')
  @ApiOperation({ summary: '签到状态' })
  status(@Req() req: any) {
    return this.service.getStatus(req.user.id);
  }

  @Post('signin')
  @ApiOperation({ summary: '执行签到（发金币+抽卡券）' })
  signin(@Req() req: any) {
    return this.service.signin(req.user.id);
  }

  @Get('player')
  @ApiOperation({ summary: '玩家信息（金币/等级）' })
  player(@Req() req: any) {
    return this.service.getPlayerInfo(req.user.id);
  }
}
