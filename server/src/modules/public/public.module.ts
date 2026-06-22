import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { Card } from '../../database/entities/card.entity';
import { DrawPool } from '../../database/entities/draw-pool.entity';
import { MergeRule } from '../../database/entities/merge-rule.entity';
import { GameConfig } from '../../database/entities/game-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Card, DrawPool, MergeRule, GameConfig])],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
