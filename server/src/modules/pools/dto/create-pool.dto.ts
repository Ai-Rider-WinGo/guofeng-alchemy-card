import { IsString, IsOptional, IsEnum, IsArray, IsObject, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PoolType } from '../../../database/entities/draw-pool.entity';

export class CreatePoolDto {
  @ApiProperty({ example: 'weekly_qinhan' })
  @IsString()
  pool_id: string;

  @ApiProperty({ example: '秦汉周卡池' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: PoolType, default: PoolType.PERMANENT })
  @IsEnum(PoolType)
  @IsOptional()
  type?: PoolType;

  @ApiProperty({ example: { common: 70, uncommon: 20, rare: 7, sr: 2.5, ssr: 0.5 } })
  @IsObject()
  rate_weights: { common: number; uncommon: number; rare: number; sr: number; ssr: number };

  @ApiProperty({ example: ['qinhan_liubang_l1', 'qinhan_xiangyu_l1'] })
  @IsArray()
  card_ids: string[];

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  rotation_schedule?: { dynasty: string; start_date: string; end_date: string; interval_weeks: number };

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdatePoolDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  rate_weights?: { common: number; uncommon: number; rare: number; sr: number; ssr: number };

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  card_ids?: string[];

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  rotation_schedule?: any;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class CreateMergeRuleDto {
  @ApiProperty({ example: '刘邦+纪信→荥阳脱困' })
  @IsString()
  rule_name: string;

  @ApiProperty({ example: ['qinhan_liubang_l1', 'qinhan_jixin_l1'] })
  @IsArray()
  input_card_ids: string[];

  @ApiProperty({ example: 'qinhan_xingyang_tuokun' })
  @IsString()
  output_card_id: string;

  @ApiPropertyOptional({ default: 1.0 })
  @IsNumber()
  @IsOptional()
  success_rate?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  consume_inputs?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  story_output?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdateMergeRuleDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  rule_name?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  input_card_ids?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  output_card_id?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  success_rate?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  consume_inputs?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  story_output?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
