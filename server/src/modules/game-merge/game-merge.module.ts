import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameMergeController } from './game-merge.controller';
import { GameMergeService } from './game-merge.service';
import { Card } from '../../database/entities/card.entity';
import { MergeRule } from '../../database/entities/merge-rule.entity';
import { PlayerInventory } from '../../database/entities/player-inventory.entity';
import { PlayerFragment } from '../../database/entities/player-fragment.entity';
import { PlayerCollection } from '../../database/entities/player-collection.entity';
import { PlayerMergeLog } from '../../database/entities/player-merge-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Card, MergeRule, PlayerInventory, PlayerFragment, PlayerCollection, PlayerMergeLog]),
  ],
  controllers: [GameMergeController],
  providers: [GameMergeService],
})
export class GameMergeModule {}
