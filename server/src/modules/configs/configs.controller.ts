import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigsService } from './configs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('运营参数')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('configs')
export class ConfigsController {
  constructor(private readonly configsService: ConfigsService) {}

  @Get()
  @ApiOperation({ summary: '获取所有运营参数' })
  findAll(@Query('category') category?: string) {
    return this.configsService.findAll(category);
  }

  @Get(':key')
  @ApiOperation({ summary: '获取单个参数' })
  get(@Param('key') key: string) {
    return this.configsService.get(key);
  }

  @Post()
  @ApiOperation({ summary: '设置单个参数' })
  set(@Body() body: { key: string; value: string; description?: string; category?: string }) {
    return this.configsService.set(body.key, body.value, body.description, body.category);
  }

  @Post('batch')
  @ApiOperation({ summary: '批量设置参数' })
  batchSet(@Body() items: { config_key: string; config_value: string; description?: string; category?: string }[]) {
    return this.configsService.batchSet(items);
  }

  @Delete(':key')
  @ApiOperation({ summary: '删除单个参数' })
  remove(@Param('key') key: string) {
    return this.configsService.remove(key);
  }
}
