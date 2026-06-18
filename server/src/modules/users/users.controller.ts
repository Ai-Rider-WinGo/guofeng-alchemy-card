import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminRole } from '../../database/entities/admin-user.entity';

@ApiTags('用户管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  findAll() { return this.usersService.findAll(); }

  @Get(':id')
  @ApiOperation({ summary: '获取用户详情' })
  findOne(@Param('id') id: string) { return this.usersService.findOne(+id); }

  @Post()
  @ApiOperation({ summary: '创建用户' })
  create(@Body() body: { username: string; password: string; display_name?: string; role?: AdminRole }) {
    return this.usersService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新用户' })
  update(@Param('id') id: string, @Body() body: { display_name?: string; role?: AdminRole; is_active?: boolean; password?: string }) {
    return this.usersService.update(+id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: '禁用用户' })
  remove(@Param('id') id: string) { return this.usersService.remove(+id); }
}
