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

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dynasty_tag?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ticket_type?: string;

  @ApiProperty({ example: { N: 60, R: 25, SR: 10, SSR: 4, UR: 1 } })
  @IsObject()
  rarity_weights: Record<string, number>;

  @ApiProperty({ example: ['liubang_002', 'xiangyu_002'] })
  @IsArray()
  featured_card_ids: string[];

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  pity_config?: { sr_every: number; ssr_every: number; ssr_hard_pity: number; description: string };

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  collection_target?: number;

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
  @IsString()
  @IsOptional()
  dynasty_tag?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ticket_type?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  rarity_weights?: Record<string, number>;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  featured_card_ids?: string[];

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  pity_config?: any;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  collection_target?: number;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  rotation_schedule?: any;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
