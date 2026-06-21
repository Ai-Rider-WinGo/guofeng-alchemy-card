import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GameMergeService } from './game-merge.service';
import { PlayerJwtAuthGuard } from '../game-auth/player-jwt.guard';

@ApiTags('玩家·合成')
@ApiBearerAuth()
@UseGuards(PlayerJwtAuthGuard)
@Controller('game/merge')
export class GameMergeController {
  constructor(private readonly service: GameMergeService) {}

  @Post('generic')
  @ApiOperation({ summary: '通用合成（同朝代同级卡升阶）' })
  generic(@Req() req: any, @Body() body: { card1_id: string; card2_id: string }) {
    return this.service.generic(req.user.id, body.card1_id, body.card2_id);
  }

  @Post('recipe')
  @ApiOperation({ summary: '配方合成（按 merge_rules 规则）' })
  recipe(@Req() req: any, @Body() body: { rule_id: string }) {
    return this.service.recipe(req.user.id, body.rule_id);
  }

  @Post('fragment')
  @ApiOperation({ summary: '碎片兑换' })
  fragment(@Req() req: any, @Body() body: { target_card_id: string; shard_key: string }) {
    return this.service.fragmentExchange(req.user.id, body.target_card_id, body.shard_key);
  }

  @Post('lv12')
  @ApiOperation({ summary: 'Lv12 合成（6张Lv11→Lv12）' })
  lv12(@Req() req: any, @Body() body: { card_ids: string[] }) {
    return this.service.lv12(req.user.id, body.card_ids);
  }
}
