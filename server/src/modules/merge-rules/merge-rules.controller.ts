import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MergeRulesService } from './merge-rules.service';
import { CreateMergeRuleDto, UpdateMergeRuleDto } from '../pools/dto/create-pool.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('合成规则')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('merge-rules')
export class MergeRulesController {
  constructor(private readonly mergeRulesService: MergeRulesService) {}

  @Get()
  @ApiOperation({ summary: '获取合成规则列表' })
  findAll() { return this.mergeRulesService.findAll(); }

  @Get(':id')
  @ApiOperation({ summary: '获取合成规则详情' })
  findOne(@Param('id') id: string) { return this.mergeRulesService.findOne(+id); }

  @Post()
  @ApiOperation({ summary: '创建合成规则' })
  create(@Body() dto: CreateMergeRuleDto) { return this.mergeRulesService.create(dto); }

  @Put(':id')
  @ApiOperation({ summary: '更新合成规则' })
  update(@Param('id') id: string, @Body() dto: UpdateMergeRuleDto) { return this.mergeRulesService.update(+id, dto); }

  @Delete(':id')
  @ApiOperation({ summary: '删除合成规则' })
  remove(@Param('id') id: string) { return this.mergeRulesService.remove(+id); }
}
