import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { CardsModule } from './modules/cards/cards.module';
import { PoolsModule } from './modules/pools/pools.module';
import { MergeRulesModule } from './modules/merge-rules/merge-rules.module';
import { ConfigsModule } from './modules/configs/configs.module';
import { UsersModule } from './modules/users/users.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AssetsModule } from './modules/assets/assets.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { PublicModule } from './modules/public/public.module';
import { ImageJobsModule } from './modules/image-jobs/image-jobs.module';
import { GameAuthModule } from './modules/game-auth/game-auth.module';
import { GameDrawModule } from './modules/game-draw/game-draw.module';
import { GameMergeModule } from './modules/game-merge/game-merge.module';
import { GameDailyModule } from './modules/game-daily/game-daily.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    CardsModule,
    PoolsModule,
    MergeRulesModule,
    ConfigsModule,
    UsersModule,
    DashboardModule,
    AssetsModule,
    AuditLogsModule,
    PublicModule,
    ImageJobsModule,
    GameAuthModule,
    GameDrawModule,
    GameMergeModule,
    GameDailyModule,
  ],
})
export class AppModule {}
