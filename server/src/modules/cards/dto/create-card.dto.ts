import { IsString, IsOptional, IsEnum, IsNumber, IsArray, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CardRarity, CardType } from '../../../database/entities/card.entity';

export class CreateCardDto {
  @ApiProperty({ example: 'liubang_002' })
  @IsString()
  card_id: string;

  @ApiProperty({ example: '刘邦' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: CardRarity, default: CardRarity.N })
  @IsEnum(CardRarity)
  @IsOptional()
  rarity?: CardRarity;

  @ApiProperty({ example: '秦汉' })
  @IsString()
  dynasty: string;

  @ApiPropertyOptional({ example: 'qin_han' })
  @IsString()
  @IsOptional()
  dynasty_tag?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @IsOptional()
  level?: number;

  @ApiPropertyOptional({ enum: CardType, default: CardType.PERSON })
  @IsEnum(CardType)
  @IsOptional()
  type?: CardType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  short_desc?: string;

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
  @IsArray()
  @IsOptional()
  merge_paths?: { target: string; partner: string; desc: string }[];

  @ApiPropertyOptional({ default: 3 })
  @IsNumber()
  @IsOptional()
  star_max?: number;

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

  @ApiPropertyOptional({ enum: CardRarity })
  @IsEnum(CardRarity)
  @IsOptional()
  rarity?: CardRarity;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dynasty?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dynasty_tag?: string;

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
  short_desc?: string;

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
  @IsArray()
  @IsOptional()
  merge_paths?: { target: string; partner: string; desc: string }[];

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  star_max?: number;

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

  @ApiPropertyOptional({ description: 'rarity: N, R, SR, SSR, UR' })
  @IsString()
  @IsOptional()
  rarity?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number;
}
