import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameDailyController } from './game-daily.controller';
import { GameDailyService } from './game-daily.service';
import { PlayerSignin } from '../../database/entities/player-signin.entity';
import { Player } from '../../database/entities/player.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlayerSignin, Player])],
  controllers: [GameDailyController],
  providers: [GameDailyService],
})
export class GameDailyModule {}
