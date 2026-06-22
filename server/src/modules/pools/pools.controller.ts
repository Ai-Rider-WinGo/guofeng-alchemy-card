import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PoolsService } from './pools.service';
import { CreatePoolDto, UpdatePoolDto } from './dto/create-pool.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('卡池配置')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pools')
export class PoolsController {
  constructor(private readonly poolsService: PoolsService) {}

  @Get()
  @ApiOperation({ summary: '获取卡池列表' })
  findAll() { return this.poolsService.findAll(); }

  @Get(':id')
  @ApiOperation({ summary: '获取卡池详情' })
  findOne(@Param('id') id: string) { return this.poolsService.findOne(+id); }

  @Post()
  @ApiOperation({ summary: '创建卡池' })
  create(@Body() dto: CreatePoolDto) { return this.poolsService.create(dto); }

  @Put(':id')
  @ApiOperation({ summary: '更新卡池' })
  update(@Param('id') id: string, @Body() dto: UpdatePoolDto) { return this.poolsService.update(+id, dto); }

  @Patch(':id/toggle')
  @ApiOperation({ summary: '快速上下架卡池（切换 is_active）' })
  toggle(@Param('id') id: string) { return this.poolsService.toggleActive(+id); }

  @Patch('batch-toggle')
  @ApiOperation({ summary: '批量上下架卡池' })
  batchToggle(@Body() body: { ids: number[]; active: boolean }) {
    return this.poolsService.batchToggle(body.ids, body.active);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除卡池' })
  remove(@Param('id') id: string) { return this.poolsService.remove(+id); }
}
