import { IsString, IsOptional, IsEnum, IsNumber, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CardQuality, CardType } from '../../../database/entities/card.entity';

export class CreateCardDto {
  @ApiProperty({ example: 'qinhan_liubang_l1' })
  @IsString()
  card_id: string;

  @ApiProperty({ example: '刘邦' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: CardQuality, default: CardQuality.COMMON })
  @IsEnum(CardQuality)
  @IsOptional()
  quality?: CardQuality;

  @ApiProperty({ example: '秦汉' })
  @IsString()
  dynasty: string;

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @IsOptional()
  level?: number;

  @ApiPropertyOptional({ enum: CardType, default: CardType.CHARACTER })
  @IsEnum(CardType)
  @IsOptional()
  type?: CardType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  thumbnail_url?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  story?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  knowledge_point?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  related_cards?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  merge_hint?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdateCardDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  card_id?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: CardQuality })
  @IsEnum(CardQuality)
  @IsOptional()
  quality?: CardQuality;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dynasty?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  level?: number;

  @ApiPropertyOptional({ enum: CardType })
  @IsEnum(CardType)
  @IsOptional()
  type?: CardType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  thumbnail_url?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  story?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  knowledge_point?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  related_cards?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  merge_hint?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class QueryCardDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dynasty?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  quality?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsNumber()
  @IsOptional()
  limit?: number;
}
