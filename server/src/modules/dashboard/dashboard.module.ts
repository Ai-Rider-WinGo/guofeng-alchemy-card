import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Card } from '../../database/entities/card.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Card])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
