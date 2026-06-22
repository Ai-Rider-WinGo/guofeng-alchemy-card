import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GameAuthController } from './game-auth.controller';
import { GameAuthService } from './game-auth.service';
import { PlayerJwtStrategy } from './player-jwt.strategy';
import { Player } from '../../database/entities/player.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Player]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'dev-secret'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '7d') },
      }),
    }),
  ],
  controllers: [GameAuthController],
  providers: [GameAuthService, PlayerJwtStrategy],
  exports: [GameAuthService, JwtModule],
})
export class GameAuthModule {}
