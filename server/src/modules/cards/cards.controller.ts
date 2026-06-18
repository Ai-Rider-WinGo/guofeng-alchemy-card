import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CardsService } from './cards.service';
import { CreateCardDto, UpdateCardDto, QueryCardDto } from './dto/create-card.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('卡牌管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get()
  @ApiOperation({ summary: '获取卡牌列表' })
  findAll(@Query() query: QueryCardDto) {
    return this.cardsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取卡牌详情' })
  findOne(@Param('id') id: string) {
    return this.cardsService.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: '创建卡牌' })
  create(@Body() dto: CreateCardDto) {
    return this.cardsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新卡牌' })
  update(@Param('id') id: string, @Body() dto: UpdateCardDto) {
    return this.cardsService.update(+id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除卡牌' })
  remove(@Param('id') id: string) {
    return this.cardsService.remove(+id);
  }

  @Post('batch-import')
  @ApiOperation({ summary: '批量导入卡牌' })
  batchImport(@Body() cards: CreateCardDto[]) {
    return this.cardsService.batchImport(cards);
  }
}
