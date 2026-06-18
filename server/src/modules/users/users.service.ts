import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AdminUser, AdminRole } from '../../database/entities/admin-user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(AdminUser)
    private readonly userRepo: Repository<AdminUser>,
  ) {}

  async findAll() {
    return this.userRepo.find({
      select: ['id', 'username', 'display_name', 'role', 'is_active', 'created_at', 'updated_at'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      select: ['id', 'username', 'display_name', 'role', 'is_active', 'created_at', 'updated_at'],
    });
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  async create(dto: { username: string; password: string; display_name?: string; role?: AdminRole }) {
    const existing = await this.userRepo.findOne({ where: { username: dto.username } });
    if (existing) throw new ConflictException('用户名已存在');

    const password_hash = await bcrypt.hash(dto.password, 10);
    return this.userRepo.save(this.userRepo.create({
      username: dto.username,
      password_hash,
      display_name: dto.display_name || dto.username,
      role: dto.role || AdminRole.VIEWER,
    }));
  }

  async update(id: number, dto: { display_name?: string; role?: AdminRole; is_active?: boolean; password?: string }) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');

    if (dto.display_name) user.display_name = dto.display_name;
    if (dto.role) user.role = dto.role;
    if (dto.is_active !== undefined) user.is_active = dto.is_active;
    if (dto.password) user.password_hash = await bcrypt.hash(dto.password, 10);

    return this.userRepo.save(user);
  }

  async remove(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');
    user.is_active = false;
    return this.userRepo.save(user);
  }
}
