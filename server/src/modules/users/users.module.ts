import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AdminUser } from '../../database/entities/admin-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdminUser])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
