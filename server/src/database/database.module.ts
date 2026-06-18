import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbType = config.get('DATABASE_TYPE', 'sqlite');
        if (dbType === 'postgres') {
          return {
            type: 'postgres',
            host: config.get('DATABASE_HOST'),
            port: config.get('DATABASE_PORT', 5432),
            username: config.get('DATABASE_USER'),
            password: config.get('DATABASE_PASSWORD'),
            database: config.get('DATABASE_NAME'),
            entities: [__dirname + '/entities/*.entity{.ts,.js}'],
            synchronize: true,
          };
        }
        return {
          type: 'sqlite',
          database: config.get('DATABASE_URL', './data.db'),
          entities: [__dirname + '/entities/*.entity{.ts,.js}'],
          synchronize: true,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
