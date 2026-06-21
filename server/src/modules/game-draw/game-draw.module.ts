import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameDrawController } from './game-draw.controller';
import { GameDrawService } from './game-draw.service';
import { Card } from '../../database/entities/card.entity';
import { DrawPool } from '../../database/entities/draw-pool.entity';
import { GameConfig } from '../../database/entities/game-config.entity';
import { PlayerInventory } from '../../database/entities/player-inventory.entity';
import { PlayerCollection } from '../../database/entities/player-collection.entity';
import { PlayerDrawLog } from '../../database/entities/player-draw-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Card, DrawPool, GameConfig, PlayerInventory, PlayerCollection, PlayerDrawLog]),
  ],
  controllers: [GameDrawController],
  providers: [GameDrawService],
  exports: [GameDrawService],
})
export class GameDrawModule {}
