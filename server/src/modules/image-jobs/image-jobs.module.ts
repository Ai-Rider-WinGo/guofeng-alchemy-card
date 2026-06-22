import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageJobsController } from './image-jobs.controller';
import { ImageJobsService } from './image-jobs.service';
import { ImageJob } from '../../database/entities/image-job.entity';
import { Card } from '../../database/entities/card.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ImageJob, Card])],
  controllers: [ImageJobsController],
  providers: [ImageJobsService],
})
export class ImageJobsModule {}
