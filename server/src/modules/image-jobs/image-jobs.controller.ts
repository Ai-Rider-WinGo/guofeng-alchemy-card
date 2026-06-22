import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ImageJobsService } from './image-jobs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('素材生成')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('image-jobs')
export class ImageJobsController {
  constructor(private readonly service: ImageJobsService) {}

  @Post('regenerate')
  @ApiOperation({ summary: '触发卡牌图片重生（ComfyUI 占位，记录 pending 任务）' })
  regenerate(@Body() body: { card_id: string; prompt?: string }, @Req() req: any) {
    return this.service.regenerate(body.card_id, body.prompt, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: '素材生成任务列表' })
  findAll(@Query('card_id') cardId?: string) {
    return this.service.findAll(cardId);
  }

  @Get(':id')
  @ApiOperation({ summary: '单个生成任务详情' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }
}
