import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AdminUser, AdminRole } from '../database/entities/admin-user.entity';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const repo = dataSource.getRepository(AdminUser);

  const existing = await repo.findOne({ where: { username: 'admin' } });
  if (!existing) {
    const hash = await bcrypt.hash('admin123', 10);
    await repo.save({
      username: 'admin',
      password_hash: hash,
      role: AdminRole.SUPER_ADMIN,
      display_name: '超级管理员',
    });
    console.log('Seed admin user created: admin / admin123');
  } else {
    console.log('Admin user already exists');
  }

  await app.close();
}
bootstrap();
