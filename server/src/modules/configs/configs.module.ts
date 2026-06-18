import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigsController } from './configs.controller';
import { ConfigsService } from './configs.service';
import { GameConfig } from '../../database/entities/game-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GameConfig])],
  controllers: [ConfigsController],
  providers: [ConfigsService],
})
export class ConfigsModule {}
