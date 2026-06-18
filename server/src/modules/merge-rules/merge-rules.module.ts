import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MergeRulesController } from './merge-rules.controller';
import { MergeRulesService } from './merge-rules.service';
import { MergeRule } from '../../database/entities/merge-rule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MergeRule])],
  controllers: [MergeRulesController],
  providers: [MergeRulesService],
})
export class MergeRulesModule {}
