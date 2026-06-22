import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PublicService, PublicCardQuery } from './public.service';

/**
 * 公开只读 API —— 供玩家前端拉取配置数据，无需登录。
 * 路由前缀：/api/public/*（全局前缀 api + 本控制器 public）
 *
 * 安全约束：本控制器只暴露 GET，严禁挂载任何写方法。
 */
@ApiTags('公开只读 API')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('cards')
  @ApiOperation({ summary: '公开·卡牌列表（支持过滤分页）' })
  findCards(@Query() query: PublicCardQuery) {
    return this.publicService.findCards(query);
  }

  @Get('cards/:cardId')
  @ApiOperation({ summary: '公开·卡牌详情（按 card_id）' })
  findCard(@Param('cardId') cardId: string) {
    return this.publicService.findCardByCardId(cardId);
  }

  @Get('pools')
  @ApiOperation({ summary: '公开·抽卡池列表' })
  findPools() {
    return this.publicService.findPools();
  }

  @Get('pools/:poolId')
  @ApiOperation({ summary: '公开·抽卡池详情（按 pool_id）' })
  findPool(@Param('poolId') poolId: string) {
    return this.publicService.findPoolByPoolId(poolId);
  }

  @Get('merge-rules')
  @ApiOperation({ summary: '公开·合成规则列表' })
  findMergeRules() {
    return this.publicService.findMergeRules();
  }

  @Get('configs')
  @ApiOperation({ summary: '公开·玩法配置列表（可按 category 过滤）' })
  findConfigs(@Query('category') category?: string) {
    return this.publicService.findConfigs(category);
  }

  @Get('configs/:key')
  @ApiOperation({ summary: '公开·单个玩法配置（按 key）' })
  findConfig(@Param('key') key: string) {
    return this.publicService.findConfig(key);
  }

  @Get('bootstrap')
  @ApiOperation({ summary: '公开·启动聚合（一次性返回全部配置 + 统计）' })
  bootstrap() {
    return this.publicService.bootstrap();
  }
}
