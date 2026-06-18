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
  ],
})
export class AppModule {}
