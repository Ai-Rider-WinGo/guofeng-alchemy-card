import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GameDrawService } from './game-draw.service';
import { PlayerJwtAuthGuard } from '../game-auth/player-jwt.guard';

@ApiTags('玩家·抽卡')
@ApiBearerAuth()
@UseGuards(PlayerJwtAuthGuard)
@Controller('game/draw')
export class GameDrawController {
  constructor(private readonly service: GameDrawService) {}

  @Post()
  @ApiOperation({ summary: '执行抽卡（服务端随机+保底+落库）' })
  draw(@Req() req: any, @Body() body: { pool_id: string; count?: number }) {
    return this.service.draw(req.user.id, body.pool_id, body.count || 1);
  }

  @Get('remaining')
  @ApiOperation({ summary: '当日剩余抽卡次数' })
  remaining(@Req() req: any) {
    return this.service.getRemaining(req.user.id);
  }

  @Get('inventory')
  @ApiOperation({ summary: '玩家背包' })
  inventory(@Req() req: any) {
    return this.service.getInventory(req.user.id);
  }

  @Get('collection')
  @ApiOperation({ summary: '玩家图鉴（已解锁卡）' })
  collection(@Req() req: any) {
    return this.service.getCollection(req.user.id);
  }

  @Get('fragments')
  @ApiOperation({ summary: '玩家碎片库存' })
  fragments(@Req() req: any) {
    return this.service.getFragments(req.user.id);
  }
}
