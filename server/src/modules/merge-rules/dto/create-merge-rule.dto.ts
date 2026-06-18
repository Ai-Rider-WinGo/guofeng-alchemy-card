import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMergeRuleDto {
  @ApiProperty({ example: 'merge_qinhan_xingyang' })
  @IsString()
  rule_id: string;

  @ApiProperty({ example: '刘邦+纪信→荥阳脱困' })
  @IsString()
  rule_name: string;

  @ApiProperty({ example: 'liubang_002' })
  @IsString()
  input_a: string;

  @ApiProperty({ example: 'jixin_002' })
  @IsString()
  input_b: string;

  @ApiProperty({ example: 'xingyang_escape_004' })
  @IsString()
  output_card_id: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  target_level?: number;

  @ApiPropertyOptional({ default: 1.0 })
  @IsNumber()
  @IsOptional()
  success_rate?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  consume_inputs?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  require_owned?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  merge_desc?: string;

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
  @IsString()
  @IsOptional()
  input_a?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  input_b?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  output_card_id?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  target_level?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  success_rate?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  consume_inputs?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  require_owned?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  merge_desc?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
