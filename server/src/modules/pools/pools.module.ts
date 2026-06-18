import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoolsController } from './pools.controller';
import { PoolsService } from './pools.service';
import { DrawPool } from '../../database/entities/draw-pool.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DrawPool])],
  controllers: [PoolsController],
  providers: [PoolsService],
})
export class PoolsModule {}
