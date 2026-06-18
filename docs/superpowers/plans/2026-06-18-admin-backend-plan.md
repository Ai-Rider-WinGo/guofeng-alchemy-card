# 后台管理系统实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建《国风炼金卡牌》运营后台：vue-vben-admin 界面 + NestJS API + SQLite(开发)/PostgreSQL(生产)

**Architecture:** 同一仓库新增 `server/`(NestJS) 和 `admin/`(vue-vben-admin)。NestJS 通过 TypeORM 操作数据库，开发用 SQLite 零成本，生产切火山引擎 PostgreSQL。前端通过 REST API 与后端通信。

**Tech Stack:** NestJS 10, TypeORM, SQLite/PostgreSQL, JWT, vue-vben-admin v5, Vue 3, Vite

---

## 文件结构
```
server/src/
├── main.ts                          # 入口：启动 NestJS，全局管道/守卫
├── app.module.ts                    # 根模块
├── common/
│   ├── guards/jwt-auth.guard.ts     # JWT 认证守卫
│   ├── interceptors/transform.interceptor.ts  # 响应包装 {code,data,message}
│   └── decorators/roles.decorator.ts          # @Roles('admin') 装饰器
├── database/
│   ├── entities/
│   │   ├── card.entity.ts           # 卡牌：name,quality,dynasty,level,image,story,tags
│   │   ├── draw-pool.entity.ts      # 卡池：type,rates,card_ids,rotation_schedule
│   │   ├── merge-rule.entity.ts     # 合成：input_cards,output_card,success_rate
│   │   ├── game-config.entity.ts    # 运营参数：key-value 结构
│   │   ├── admin-user.entity.ts     # 后台用户：username,password_hash,role
│   │   └── audit-log.entity.ts      # 操作日志：user,action,target,detail,timestamp
│   └── database.module.ts           # TypeORM 配置（读取 .env）
├── modules/
│   ├── auth/                        # 登录/登出/刷新Token
│   ├── cards/                       # 卡牌 CRUD
│   ├── pools/                       # 卡池 CRUD
│   ├── merge-rules/                 # 合成规则 CRUD
│   ├── configs/                     # 运营参数 CRUD
│   ├── users/                       # 后台用户 CRUD
│   ├── dashboard/                   # 数据看板聚合查询
│   ├── assets/                      # 素材上传/管理
│   └── audit-logs/                  # 操作日志查询
├── seed/seed.ts                     # 种子数据（从现有 JSON 配置导入）

admin/src/
├── api/request.ts                   # Axios 实例，拦截器
├── api/cards.ts                     # 卡牌 API 调用
├── api/pools.ts                     # 卡池 API 调用
├── api/merge-rules.ts               # 合成规则 API 调用
├── api/configs.ts                   # 运营参数 API 调用
├── api/auth.ts                      # 认证 API 调用
├── api/users.ts                     # 用户管理 API 调用
├── api/dashboard.ts                 # 数据看板 API 调用
├── views/
│   ├── cards/                       # 卡牌列表 + 编辑弹窗
│   ├── pools/                       # 卡池配置 + 概率设置
│   ├── merge-rules/                 # 合成规则列表 + 编辑
│   ├── configs/                     # 运营参数编辑
│   ├── dashboard/                   # 统计图表
│   └── system/                      # 用户/角色管理
└── router/                          # 路由配置（含权限）
```

---

## Phase 1: 后端基础

### Task 1: 初始化 NestJS 项目

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/nest-cli.json`
- Create: `server/.env`
- Create: `server/.env.production`
- Create: `server/src/main.ts`
- Create: `server/src/app.module.ts`

- [ ] **Step 1: 创建 server 目录并初始化 package.json**

```bash
mkdir server && cd server && npm init -y
npm install @nestjs/core @nestjs/common @nestjs/platform-express @nestjs/config @nestjs/typeorm typeorm reflect-metadata rxjs
npm install -D @nestjs/cli @nestjs/schematics typescript @types/node ts-node
```

- [ ] **Step 2: 编写 package.json**

`server/package.json`:
```json
{
  "name": "guofeng-alchemy-server",
  "version": "0.1.0",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "seed": "ts-node src/seed/seed.ts",
    "migration:generate": "typeorm-ts-node-commonjs migration:generate -d src/database/data-source.ts",
    "migration:run": "typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "bcryptjs": "^2.4.3",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "multer": "^1.4.5-lts.1",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.1.14",
    "rxjs": "^7.8.0",
    "sqlite3": "^5.1.0",
    "typeorm": "^0.3.0",
    "pg": "^8.11.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@types/bcryptjs": "^2.4.0",
    "@types/express": "^4.17.0",
    "@types/multer": "^1.4.0",
    "@types/node": "^20.0.0",
    "@types/passport-jwt": "^4.0.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.3.0"
  }
}
```

- [ ] **Step 3: 编写 tsconfig.json**

`server/tsconfig.json`:
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 4: 编写 nest-cli.json**

`server/nest-cli.json`:
```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

- [ ] **Step 5: 编写环境变量文件**

`server/.env`:
```env
NODE_ENV=development
PORT=3000
DATABASE_TYPE=sqlite
DATABASE_URL=./data.db
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
```

`server/.env.production`:
```env
NODE_ENV=production
PORT=3000
DATABASE_TYPE=postgres
DATABASE_HOST=your-pg-host.volcengine.com
DATABASE_PORT=5432
DATABASE_USER=your-user
DATABASE_PASSWORD=your-password
DATABASE_NAME=guofeng_alchemy
REDIS_HOST=your-redis-host.volcengine.com
REDIS_PORT=6379
JWT_SECRET=your-secure-random-secret
JWT_EXPIRES_IN=7d
UPLOAD_DIR=/data/uploads
```

- [ ] **Step 6: 编写 main.ts**

`server/src/main.ts`:
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const config = new DocumentBuilder()
    .setTitle('国风炼金卡牌 - 后台 API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
```

- [ ] **Step 7: 编写 app.module.ts**

`server/src/app.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
```

- [ ] **Step 8: 安装依赖并验证启动**

```bash
cd server && npm install && npm run start:dev
```

Expected: `Server running on http://localhost:3000`

- [ ] **Step 9: Commit**

```bash
git add server/
git commit -m "feat: init NestJS project with basic configuration"
```

---

### Task 2: 数据库配置与实体

**Files:**
- Create: `server/src/database/database.module.ts`
- Create: `server/src/database/entities/card.entity.ts`
- Create: `server/src/database/entities/draw-pool.entity.ts`
- Create: `server/src/database/entities/merge-rule.entity.ts`
- Create: `server/src/database/entities/game-config.entity.ts`
- Create: `server/src/database/entities/admin-user.entity.ts`
- Create: `server/src/database/entities/audit-log.entity.ts`

- [ ] **Step 1: 编写 database.module.ts**

`server/src/database/database.module.ts`:
```typescript
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
            synchronize: true, // 生产环境应设为 false 并使用 migration
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
```

- [ ] **Step 2: 编写 card.entity.ts**

`server/src/database/entities/card.entity.ts`:
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum CardQuality {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  SR = 'sr',
  SSR = 'ssr',
  TREASURE = 'treasure',
}

export enum CardType {
  CHARACTER = 'character',
  PLACE = 'place',
  EVENT = 'event',
  STAGE_EVENT = 'stage_event',
}

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  card_id: string; // e.g. "qinhan_liubang_l1"

  @Column()
  name: string; // 刘邦

  @Column({ type: 'varchar', default: CardQuality.COMMON })
  quality: CardQuality;

  @Column()
  dynasty: string; // 秦汉

  @Column({ default: 1 })
  level: number;

  @Column({ type: 'varchar', default: CardType.CHARACTER })
  type: CardType;

  @Column({ nullable: true })
  image_url: string;

  @Column({ nullable: true })
  thumbnail_url: string;

  @Column({ type: 'text', nullable: true })
  story: string; // 历史故事

  @Column({ type: 'text', nullable: true })
  knowledge_point: string; // 知识点

  @Column({ type: 'simple-json', nullable: true })
  tags: string[]; // 标签

  @Column({ type: 'simple-json', nullable: true })
  related_cards: string[]; // 关联卡牌 card_id

  @Column({ type: 'text', nullable: true })
  merge_hint: string; // 合成提示

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

- [ ] **Step 3: 编写 draw-pool.entity.ts**

`server/src/database/entities/draw-pool.entity.ts`:
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PoolType {
  PERMANENT = 'permanent_basic',
  WEEKLY = 'weekly',
  LIMITED = 'limited_premium',
}

@Entity('draw_pools')
export class DrawPool {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  pool_id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: PoolType.PERMANENT })
  type: PoolType;

  @Column({ type: 'simple-json' })
  rate_weights: {
    common: number;
    uncommon: number;
    rare: number;
    sr: number;
    ssr: number;
  };

  @Column({ type: 'simple-json' })
  card_ids: string[]; // 该池包含的卡牌 card_id 列表

  @Column({ type: 'simple-json', nullable: true })
  rotation_schedule: {
    dynasty: string;
    start_date: string;
    end_date: string;
    interval_weeks: number;
  };

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

- [ ] **Step 4: 编写 merge-rule.entity.ts**

`server/src/database/entities/merge-rule.entity.ts`:
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('merge_rules')
export class MergeRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  rule_name: string; // e.g. "刘邦+纪信→荥阳脱困"

  @Column({ type: 'simple-json' })
  input_card_ids: string[]; // 需要的卡牌 card_id

  @Column()
  output_card_id: string; // 产生的卡牌 card_id

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  success_rate: number; // 0.00 ~ 1.00

  @Column({ default: true })
  consume_inputs: boolean;

  @Column({ type: 'text', nullable: true })
  story_output: string; // 合成结果故事文本

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

- [ ] **Step 5: 编写 game-config.entity.ts**

`server/src/database/entities/game-config.entity.ts`:
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('game_configs')
export class GameConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  config_key: string; // e.g. "daily_free_draws"

  @Column({ type: 'text' })
  config_value: string; // JSON string

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string; // e.g. "daily_limits", "rewards", "duplicate_rules"

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

- [ ] **Step 6: 编写 admin-user.entity.ts**

`server/src/database/entities/admin-user.entity.ts`:
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
}

@Entity('admin_users')
export class AdminUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password_hash: string;

  @Column({ type: 'varchar', default: AdminRole.VIEWER })
  role: AdminRole;

  @Column({ nullable: true })
  display_name: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

- [ ] **Step 7: 编写 audit-log.entity.ts**

`server/src/database/entities/audit-log.entity.ts`:
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  username: string;

  @Column()
  action: string; // CREATE, UPDATE, DELETE

  @Column()
  target: string; // e.g. "card", "pool", "merge_rule"

  @Column({ nullable: true })
  target_id: string;

  @Column({ type: 'text', nullable: true })
  detail: string; // JSON: changes made

  @Column({ nullable: true })
  ip_address: string;

  @CreateDateColumn()
  created_at: Date;
}
```

- [ ] **Step 8: Commit**

```bash
git add server/src/database/
git commit -m "feat: add TypeORM database config and all entities"
```

---

### Task 3: 认证模块 (Auth)

**Files:**
- Create: `server/src/modules/auth/auth.module.ts`
- Create: `server/src/modules/auth/auth.controller.ts`
- Create: `server/src/modules/auth/auth.service.ts`
- Create: `server/src/modules/auth/dto/login.dto.ts`
- Create: `server/src/common/guards/jwt-auth.guard.ts`
- Create: `server/src/common/decorators/roles.decorator.ts`
- Create: `server/src/common/interceptors/transform.interceptor.ts`

- [ ] **Step 1: 编写 jwt-auth.guard.ts**

`server/src/common/guards/jwt-auth.guard.ts`:
```typescript
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('请先登录');
    }
    return user;
  }
}
```

- [ ] **Step 2: 编写 roles.decorator.ts**

`server/src/common/decorators/roles.decorator.ts`:
```typescript
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

- [ ] **Step 3: 编写 transform.interceptor.ts**

`server/src/common/interceptors/transform.interceptor.ts`:
```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map(data => ({
        code: 0,
        data,
        message: 'success',
      })),
    );
  }
}
```

- [ ] **Step 4: 编写 login.dto.ts**

`server/src/modules/auth/dto/login.dto.ts`:
```typescript
import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;
}
```

- [ ] **Step 5: 编写 auth.service.ts**

`server/src/modules/auth/auth.service.ts`:
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AdminUser } from '../../database/entities/admin-user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AdminUser)
    private readonly userRepo: Repository<AdminUser>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { username: dto.username, is_active: true } });
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const payload = { sub: user.id, username: user.username, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        role: user.role,
      },
    };
  }

  async validateUser(userId: number): Promise<AdminUser | null> {
    return this.userRepo.findOne({ where: { id: userId, is_active: true } });
  }
}
```

- [ ] **Step 6: 编写 JWT strategy（内联到 auth.module.ts 或单独文件）**

`server/src/modules/auth/jwt.strategy.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET', 'dev-secret'),
    });
  }

  async validate(payload: any) {
    return { id: payload.sub, username: payload.username, role: payload.role };
  }
}
```

- [ ] **Step 7: 编写 auth.controller.ts**

`server/src/modules/auth/auth.controller.ts`:
```typescript
import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '后台登录' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  getProfile(@Request() req: any) {
    return req.user;
  }
}
```

- [ ] **Step 8: 编写 auth.module.ts**

`server/src/modules/auth/auth.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { AdminUser } from '../../database/entities/admin-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminUser]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'dev-secret'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '7d') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

- [ ] **Step 9: 创建种子用户脚本**

`server/src/seed/seed.ts`:
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepository } from 'typeorm';
import { AdminUser, AdminRole } from '../database/entities/admin-user.entity';
import * as bcrypt from 'bcryptjs';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const repo = app.get(getRepository(AdminUser));

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
```

- [ ] **Step 10: 注册 TransformInterceptor 到 main.ts**

修改 `server/src/main.ts`，在 bootstrap 函数中加入：
```typescript
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
// ...
app.useGlobalInterceptors(new TransformInterceptor());
```

- [ ] **Step 11: 验证**

```bash
cd server && npm run start:dev
# 测试登录:
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Expected: 返回 `{ code: 0, data: { token: "...", user: {...} }, message: "success" }`

- [ ] **Step 12: Commit**

```bash
git add server/src/modules/auth/ server/src/common/ server/src/seed/
git commit -m "feat: add auth module with JWT, guards, and seed script"
```

---

## Phase 2: 核心业务模块

### Task 4: 卡牌管理 CRUD

**Files:**
- Create: `server/src/modules/cards/cards.module.ts`
- Create: `server/src/modules/cards/cards.controller.ts`
- Create: `server/src/modules/cards/cards.service.ts`
- Create: `server/src/modules/cards/dto/create-card.dto.ts`
- Create: `server/src/modules/cards/dto/query-card.dto.ts`

- [ ] **Step 1: 编写 DTO**

`server/src/modules/cards/dto/create-card.dto.ts`:
```typescript
import { IsString, IsOptional, IsEnum, IsNumber, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CardQuality, CardType } from '../../../database/entities/card.entity';

export class CreateCardDto {
  @ApiProperty({ example: 'qinhan_liubang_l1' })
  @IsString()
  card_id: string;

  @ApiProperty({ example: '刘邦' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: CardQuality, default: CardQuality.COMMON })
  @IsEnum(CardQuality)
  @IsOptional()
  quality?: CardQuality;

  @ApiProperty({ example: '秦汉' })
  @IsString()
  dynasty: string;

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @IsOptional()
  level?: number;

  @ApiPropertyOptional({ enum: CardType, default: CardType.CHARACTER })
  @IsEnum(CardType)
  @IsOptional()
  type?: CardType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  thumbnail_url?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  story?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  knowledge_point?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  related_cards?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  merge_hint?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdateCardDto extends CreateCardDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  card_id?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dynasty?: string;
}

export class QueryCardDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dynasty?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  quality?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  keyword?: string; // 搜索名称/标签

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsNumber()
  @IsOptional()
  limit?: number;
}
```

- [ ] **Step 2: 编写 cards.service.ts**

`server/src/modules/cards/cards.service.ts`:
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Card } from '../../database/entities/card.entity';
import { CreateCardDto, UpdateCardDto, QueryCardDto } from './dto/create-card.dto';

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
  ) {}

  async findAll(query: QueryCardDto) {
    const { dynasty, quality, type, keyword, page = 1, limit = 20 } = query;
    const where: any = {};

    if (dynasty) where.dynasty = dynasty;
    if (quality) where.quality = quality;
    if (type) where.type = type;

    const qb = this.cardRepo.createQueryBuilder('card').where(where);

    if (keyword) {
      qb.andWhere('(card.name LIKE :kw OR card.tags LIKE :kw)', { kw: `%${keyword}%` });
    }

    qb.skip((page - 1) * limit).take(limit).orderBy('card.created_at', 'DESC');

    const [list, total] = await qb.getManyAndCount();
    return { list, total, page, limit };
  }

  async findOne(id: number) {
    const card = await this.cardRepo.findOne({ where: { id } });
    if (!card) throw new NotFoundException('卡牌不存在');
    return card;
  }

  async create(dto: CreateCardDto) {
    const card = this.cardRepo.create(dto);
    return this.cardRepo.save(card);
  }

  async update(id: number, dto: UpdateCardDto) {
    const card = await this.findOne(id);
    Object.assign(card, dto);
    return this.cardRepo.save(card);
  }

  async remove(id: number) {
    const card = await this.findOne(id);
    await this.cardRepo.remove(card);
    return { deleted: true };
  }

  async batchImport(cards: CreateCardDto[]) {
    const saved = [];
    for (const dto of cards) {
      const existing = await this.cardRepo.findOne({ where: { card_id: dto.card_id } });
      if (existing) {
        Object.assign(existing, dto);
        saved.push(await this.cardRepo.save(existing));
      } else {
        saved.push(await this.cardRepo.save(this.cardRepo.create(dto)));
      }
    }
    return { count: saved.length };
  }
}
```

- [ ] **Step 3: 编写 cards.controller.ts**

`server/src/modules/cards/cards.controller.ts`:
```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CardsService } from './cards.service';
import { CreateCardDto, UpdateCardDto, QueryCardDto } from './dto/create-card.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('卡牌管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get()
  @ApiOperation({ summary: '获取卡牌列表' })
  findAll(@Query() query: QueryCardDto) {
    return this.cardsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取卡牌详情' })
  findOne(@Param('id') id: string) {
    return this.cardsService.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: '创建卡牌' })
  create(@Body() dto: CreateCardDto) {
    return this.cardsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新卡牌' })
  update(@Param('id') id: string, @Body() dto: UpdateCardDto) {
    return this.cardsService.update(+id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除卡牌' })
  remove(@Param('id') id: string) {
    return this.cardsService.remove(+id);
  }

  @Post('batch-import')
  @ApiOperation({ summary: '批量导入卡牌' })
  batchImport(@Body() cards: CreateCardDto[]) {
    return this.cardsService.batchImport(cards);
  }
}
```

- [ ] **Step 4: 编写 cards.module.ts**

`server/src/modules/cards/cards.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { Card } from '../../database/entities/card.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Card])],
  controllers: [CardsController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}
```

- [ ] **Step 5: 验证**

```bash
# 先登录获取 token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.data.token')

# 创建卡牌
curl -X POST http://localhost:3000/api/cards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"card_id":"qinhan_liubang_l1","name":"刘邦","dynasty":"秦汉","quality":"ssr","type":"character","level":5}'

# 查询列表
curl http://localhost:3000/api/cards \
  -H "Authorization: Bearer $TOKEN"
```

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/cards/
git commit -m "feat: add cards CRUD module"
```

---

### Task 5: 卡池配置 CRUD

**Files:**
- Create: `server/src/modules/pools/pools.module.ts`
- Create: `server/src/modules/pools/pools.controller.ts`
- Create: `server/src/modules/pools/pools.service.ts`
- Create: `server/src/modules/pools/dto/create-pool.dto.ts`

卡池模块结构与卡牌模块高度相似，以下给出核心 Service 和 Controller：

- [ ] **Step 1: 编写 pools.service.ts**

`server/src/modules/pools/pools.service.ts`:
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DrawPool } from '../../database/entities/draw-pool.entity';
import { CreatePoolDto, UpdatePoolDto } from './dto/create-pool.dto';

@Injectable()
export class PoolsService {
  constructor(
    @InjectRepository(DrawPool)
    private readonly poolRepo: Repository<DrawPool>,
  ) {}

  async findAll() {
    return this.poolRepo.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: number) {
    const pool = await this.poolRepo.findOne({ where: { id } });
    if (!pool) throw new NotFoundException('卡池不存在');
    return pool;
  }

  async create(dto: CreatePoolDto) {
    return this.poolRepo.save(this.poolRepo.create(dto));
  }

  async update(id: number, dto: UpdatePoolDto) {
    const pool = await this.findOne(id);
    Object.assign(pool, dto);
    return this.poolRepo.save(pool);
  }

  async remove(id: number) {
    const pool = await this.findOne(id);
    await this.poolRepo.remove(pool);
    return { deleted: true };
  }
}
```

- [ ] **Step 2: 编写 pools.controller.ts**

`server/src/modules/pools/pools.controller.ts`:
```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PoolsService } from './pools.service';
import { CreatePoolDto, UpdatePoolDto } from './dto/create-pool.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('卡池配置')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pools')
export class PoolsController {
  constructor(private readonly poolsService: PoolsService) {}

  @Get()
  @ApiOperation({ summary: '获取卡池列表' })
  findAll() { return this.poolsService.findAll(); }

  @Get(':id')
  @ApiOperation({ summary: '获取卡池详情' })
  findOne(@Param('id') id: string) { return this.poolsService.findOne(+id); }

  @Post()
  @ApiOperation({ summary: '创建卡池' })
  create(@Body() dto: CreatePoolDto) { return this.poolsService.create(dto); }

  @Put(':id')
  @ApiOperation({ summary: '更新卡池' })
  update(@Param('id') id: string, @Body() dto: UpdatePoolDto) { return this.poolsService.update(+id, dto); }

  @Delete(':id')
  @ApiOperation({ summary: '删除卡池' })
  remove(@Param('id') id: string) { return this.poolsService.remove(+id); }
}
```

- [ ] **Step 3: 编写 DTO 和 Module（结构与 cards 一致，省略重复）**

`server/src/modules/pools/pools.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoolsController } from './pools.controller';
import { PoolsService } from './pools.service';
import { DrawPool } from '../../database/entities/draw-pool.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DrawPool])],
  controllers: [PoolsController],
  providers: [PoolsService],
})
export class PoolsModule {}
```

- [ ] **Step 4: Commit**

```bash
git add server/src/modules/pools/
git commit -m "feat: add draw pools CRUD module"
```

---

### Task 6: 合成规则 CRUD

**Files:**
- Create: `server/src/modules/merge-rules/merge-rules.module.ts`
- Create: `server/src/modules/merge-rules/merge-rules.controller.ts`
- Create: `server/src/modules/merge-rules/merge-rules.service.ts`
- Create: `server/src/modules/merge-rules/dto/create-merge-rule.dto.ts`

结构与 cards/pools 完全一致，仅 entity 不同。Service 和 Controller 的代码模式完全相同。

- [ ] **Step 1: 编写 merge-rules.service.ts**

`server/src/modules/merge-rules/merge-rules.service.ts`:
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MergeRule } from '../../database/entities/merge-rule.entity';
import { CreateMergeRuleDto, UpdateMergeRuleDto } from './dto/create-merge-rule.dto';

@Injectable()
export class MergeRulesService {
  constructor(
    @InjectRepository(MergeRule)
    private readonly ruleRepo: Repository<MergeRule>,
  ) {}

  async findAll() {
    return this.ruleRepo.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: number) {
    const rule = await this.ruleRepo.findOne({ where: { id } });
    if (!rule) throw new NotFoundException('合成规则不存在');
    return rule;
  }

  async create(dto: CreateMergeRuleDto) {
    return this.ruleRepo.save(this.ruleRepo.create(dto));
  }

  async update(id: number, dto: UpdateMergeRuleDto) {
    const rule = await this.findOne(id);
    Object.assign(rule, dto);
    return this.ruleRepo.save(rule);
  }

  async remove(id: number) {
    const rule = await this.findOne(id);
    await this.ruleRepo.remove(rule);
    return { deleted: true };
  }
}
```

- [ ] **Step 2: 编写 merge-rules.controller.ts**

`server/src/modules/merge-rules/merge-rules.controller.ts`:
```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MergeRulesService } from './merge-rules.service';
import { CreateMergeRuleDto, UpdateMergeRuleDto } from './dto/create-merge-rule.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('合成规则')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('merge-rules')
export class MergeRulesController {
  constructor(private readonly mergeRulesService: MergeRulesService) {}

  @Get()
  @ApiOperation({ summary: '获取合成规则列表' })
  findAll() { return this.mergeRulesService.findAll(); }

  @Get(':id')
  @ApiOperation({ summary: '获取合成规则详情' })
  findOne(@Param('id') id: string) { return this.mergeRulesService.findOne(+id); }

  @Post()
  @ApiOperation({ summary: '创建合成规则' })
  create(@Body() dto: CreateMergeRuleDto) { return this.mergeRulesService.create(dto); }

  @Put(':id')
  @ApiOperation({ summary: '更新合成规则' })
  update(@Param('id') id: string, @Body() dto: UpdateMergeRuleDto) { return this.mergeRulesService.update(+id, dto); }

  @Delete(':id')
  @ApiOperation({ summary: '删除合成规则' })
  remove(@Param('id') id: string) { return this.mergeRulesService.remove(+id); }
}
```

- [ ] **Step 3: 编写 DTO 和 Module**

`server/src/modules/merge-rules/merge-rules.module.ts`:
```typescript
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
```

- [ ] **Step 4: Commit**

```bash
git add server/src/modules/merge-rules/
git commit -m "feat: add merge rules CRUD module"
```

---

### Task 7: 运营参数 CRUD

**Files:**
- Create: `server/src/modules/configs/configs.module.ts`
- Create: `server/src/modules/configs/configs.controller.ts`
- Create: `server/src/modules/configs/configs.service.ts`
- Create: `server/src/modules/configs/dto/upsert-config.dto.ts`

- [ ] **Step 1: 编写 configs.service.ts**

`server/src/modules/configs/configs.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameConfig } from '../../database/entities/game-config.entity';

@Injectable()
export class ConfigsService {
  constructor(
    @InjectRepository(GameConfig)
    private readonly configRepo: Repository<GameConfig>,
  ) {}

  async findAll(category?: string) {
    const where: any = {};
    if (category) where.category = category;
    return this.configRepo.find({ where, order: { category: 'ASC' } });
  }

  async get(key: string) {
    return this.configRepo.findOne({ where: { config_key: key } });
  }

  async set(key: string, value: string, description?: string, category?: string) {
    let config = await this.configRepo.findOne({ where: { config_key: key } });
    if (config) {
      config.config_value = value;
      if (description) config.description = description;
      if (category) config.category = category;
    } else {
      config = this.configRepo.create({ config_key: key, config_value: value, description, category });
    }
    return this.configRepo.save(config);
  }

  async batchSet(items: { config_key: string; config_value: string; description?: string; category?: string }[]) {
    const results = [];
    for (const item of items) {
      results.push(await this.set(item.config_key, item.config_value, item.description, item.category));
    }
    return results;
  }
}
```

- [ ] **Step 2: 编写 configs.controller.ts**

`server/src/modules/configs/configs.controller.ts`:
```typescript
import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigsService } from './configs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('运营参数')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('configs')
export class ConfigsController {
  constructor(private readonly configsService: ConfigsService) {}

  @Get()
  @ApiOperation({ summary: '获取所有运营参数' })
  findAll(@Query('category') category?: string) {
    return this.configsService.findAll(category);
  }

  @Get(':key')
  @ApiOperation({ summary: '获取单个参数' })
  get(@Param('key') key: string) {
    return this.configsService.get(key);
  }

  @Post()
  @ApiOperation({ summary: '设置单个参数' })
  set(@Body() body: { key: string; value: string; description?: string; category?: string }) {
    return this.configsService.set(body.key, body.value, body.description, body.category);
  }

  @Post('batch')
  @ApiOperation({ summary: '批量设置参数' })
  batchSet(@Body() items: { config_key: string; config_value: string; description?: string; category?: string }[]) {
    return this.configsService.batchSet(items);
  }
}
```

- [ ] **Step 3: 编写 configs.module.ts**

`server/src/modules/configs/configs.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigsController } from './configs.controller';
import { ConfigsService } from './configs.service';
import { GameConfig } from '../../database/entities/game-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GameConfig])],
  controllers: [ConfigsController],
  providers: [ConfigsService],
})
export class ConfigsModule {}
```

- [ ] **Step 4: Commit**

```bash
git add server/src/modules/configs/
git commit -m "feat: add game configs module"
```

---

### Task 8: 后台用户管理

**Files:**
- Create: `server/src/modules/users/users.module.ts`
- Create: `server/src/modules/users/users.controller.ts`
- Create: `server/src/modules/users/users.service.ts`

- [ ] **Step 1: 编写 users.service.ts**

`server/src/modules/users/users.service.ts`:
```typescript
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
    // 软删除：设为不活跃
    user.is_active = false;
    return this.userRepo.save(user);
  }
}
```

- [ ] **Step 2: 编写 users.controller.ts 和 users.module.ts（模式同上）**

Controller 结构与其他 CRUD 模块一致：`GET /users`, `GET /users/:id`, `POST /users`, `PUT /users/:id`, `DELETE /users/:id`

Module 注册 TypeOrmModule.forFeature([AdminUser])。

- [ ] **Step 3: Commit**

```bash
git add server/src/modules/users/
git commit -m "feat: add admin users management module"
```

---

## Phase 3: 扩展功能

### Task 9: 数据看板

**Files:**
- Create: `server/src/modules/dashboard/dashboard.module.ts`
- Create: `server/src/modules/dashboard/dashboard.controller.ts`
- Create: `server/src/modules/dashboard/dashboard.service.ts`

- [ ] **Step 1: 编写 dashboard.service.ts**

`server/src/modules/dashboard/dashboard.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from '../../database/entities/card.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
  ) {}

  async getOverview() {
    const totalCards = await this.cardRepo.count();
    const activeCards = await this.cardRepo.count({ where: { is_active: true } });

    const byDynasty = await this.cardRepo
      .createQueryBuilder('card')
      .select('card.dynasty', 'dynasty')
      .addSelect('COUNT(*)', 'count')
      .groupBy('card.dynasty')
      .getRawMany();

    const byQuality = await this.cardRepo
      .createQueryBuilder('card')
      .select('card.quality', 'quality')
      .addSelect('COUNT(*)', 'count')
      .groupBy('card.quality')
      .getRawMany();

    const byType = await this.cardRepo
      .createQueryBuilder('card')
      .select('card.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('card.type')
      .getRawMany();

    return {
      total_cards: totalCards,
      active_cards: activeCards,
      by_dynasty: byDynasty,
      by_quality: byQuality,
      by_type: byType,
    };
  }
}
```

- [ ] **Step 2: 编写 dashboard.controller.ts 和 module**

Controller:
```typescript
@ApiTags('数据看板')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: '获取概览数据' })
  getOverview() {
    return this.dashboardService.getOverview();
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add server/src/modules/dashboard/
git commit -m "feat: add dashboard overview endpoint"
```

---

### Task 10: 素材管理

**Files:**
- Create: `server/src/modules/assets/assets.module.ts`
- Create: `server/src/modules/assets/assets.controller.ts`
- Create: `server/src/modules/assets/assets.service.ts`

核心功能：上传卡牌图片，返回 URL。Multer 处理文件上传，本地存储（开发）/ TOS（生产）。

- [ ] **Step 1: 编写 assets.service.ts**

`server/src/modules/assets/assets.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

@Injectable()
export class AssetsService {
  constructor(private config: ConfigService) {}

  getUploadDir() {
    const dir = this.config.get('UPLOAD_DIR', './uploads');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }

  async saveFile(file: Express.Multer.File) {
    const url = `/uploads/${file.filename}`;
    return {
      filename: file.filename,
      original_name: file.originalname,
      size: file.size,
      url,
    };
  }

  listFiles() {
    const fs = require('fs');
    const dir = this.getUploadDir();
    const files = fs.readdirSync(dir);
    return files.map((f: string) => ({
      filename: f,
      url: `/uploads/${f}`,
    }));
  }
}
```

- [ ] **Step 2: 编写 assets.controller.ts**

```typescript
import { Controller, Get, Post, Delete, Param, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('素材管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '上传图片' })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (_, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + extname(file.originalname));
      },
    }),
  }))
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.assetsService.saveFile(file);
  }

  @Get()
  @ApiOperation({ summary: '获取素材列表' })
  list() {
    return this.assetsService.listFiles();
  }

  @Delete(':filename')
  @ApiOperation({ summary: '删除素材' })
  remove(@Param('filename') filename: string) {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(this.assetsService.getUploadDir(), filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return { deleted: true };
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add server/src/modules/assets/
git commit -m "feat: add assets upload module"
```

---

### Task 11: 操作日志

**Files:**
- Create: `server/src/modules/audit-logs/audit-logs.module.ts`
- Create: `server/src/modules/audit-logs/audit-logs.controller.ts`
- Create: `server/src/modules/audit-logs/audit-logs.service.ts`

只有查询功能（日志由各业务模块写入）。结构与其他模块一致。

- [ ] **Step 1: 编写 audit-logs.service.ts**

```typescript
@Injectable()
export class AuditLogsService {
  constructor(@InjectRepository(AuditLog) private logRepo: Repository<AuditLog>) {}

  async findAll(query: { page?: number; limit?: number; target?: string; username?: string }) {
    const { page = 1, limit = 50, target, username } = query;
    const where: any = {};
    if (target) where.target = target;
    if (username) where.username = username;
    const [list, total] = await this.logRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });
    return { list, total, page, limit };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/modules/audit-logs/
git commit -m "feat: add audit logs query module"
```

---

## Phase 4: 前端后台 (vue-vben-admin)

### Task 12: 初始化 vue-vben-admin 项目

**Files:**
- 通过 CLI 脚手架创建 `admin/` 目录下完整项目
- Create: `admin/.env`
- Create: `admin/.env.production`

- [ ] **Step 1: 创建 vue-vben-admin 项目**

```bash
# 使用 vben 官方脚手架
npx @vbenjs/create-app@latest

# 交互选项：
# Project name: admin
# Select version: v5
# 选择需要的插件：router, pinia, i18n
```

（注意：vue-vben-admin v5 脚手架命令可能变化，以下提供了手动创建方案作为保底）

**备选方案：直接克隆官方的精简模板**

```bash
cd F:/guofeng-alchemy-card
git clone https://github.com/vbenjs/vue-vben-admin.git admin-temp
# 然后只保留需要的部分，或直接在 admin-temp 基础上开发
```

- [ ] **Step 2: 配置环境变量**

`admin/.env`:
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_TITLE=国风炼金·后台管理
```

`admin/.env.production`:
```env
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_APP_TITLE=国风炼金·后台管理
```

- [ ] **Step 3: 配置 API 代理**

修改 `admin/vite.config.ts`，加入代理：
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
    '/uploads': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

- [ ] **Step 4: 验证启动**

```bash
cd admin && npm install && npm run dev
```

Expected: 打开 `http://localhost:5173` 看到 vue-vben-admin 默认页面

- [ ] **Step 5: Commit**

```bash
git add admin/
git commit -m "feat: init vue-vben-admin project"
```

---

### Task 13: Admin API 请求层

**Files:**
- Create: `admin/src/api/request.ts`
- Create: `admin/src/api/auth.ts`
- Create: `admin/src/api/cards.ts`
- Create: `admin/src/api/pools.ts`
- Create: `admin/src/api/merge-rules.ts`
- Create: `admin/src/api/configs.ts`
- Create: `admin/src/api/users.ts`
- Create: `admin/src/api/dashboard.ts`

- [ ] **Step 1: 编写 request.ts (Axios 实例)**

`admin/src/api/request.ts`:
```typescript
import axios from 'axios';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
});

// 请求拦截器：自动附带 token
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：统一错误处理
request.interceptors.response.use(
  (response) => {
    const { code, data, message } = response.data;
    if (code === 0) return data;
    return Promise.reject(new Error(message || '请求失败'));
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default request;
```

- [ ] **Step 2: 编写 auth.ts**

`admin/src/api/auth.ts`:
```typescript
import request from './request';

export const authApi = {
  login(data: { username: string; password: string }) {
    return request.post('/auth/login', data);
  },
  getProfile() {
    return request.get('/auth/profile');
  },
};
```

- [ ] **Step 3: 编写 cards.ts**

`admin/src/api/cards.ts`:
```typescript
import request from './request';

export const cardsApi = {
  getList(params?: any) {
    return request.get('/cards', { params });
  },
  getById(id: number) {
    return request.get(`/cards/${id}`);
  },
  create(data: any) {
    return request.post('/cards', data);
  },
  update(id: number, data: any) {
    return request.put(`/cards/${id}`, data);
  },
  delete(id: number) {
    return request.delete(`/cards/${id}`);
  },
  batchImport(cards: any[]) {
    return request.post('/cards/batch-import', cards);
  },
};
```

- [ ] **Step 4: 编写其余 API 文件**

`pools.ts`, `merge-rules.ts`, `configs.ts`, `users.ts`, `dashboard.ts` 遵循相同模式——每个文件导出一个对象，方法对应后端接口。

- [ ] **Step 5: Commit**

```bash
git add admin/src/api/
git commit -m "feat: add API request layer for admin"
```

---

### Task 14: Admin 页面

**Files (在 vue-vben-admin 框架内，利用其模板组件):**
- 登录页（利用 vben 自带）
- 卡牌管理页
- 卡池配置页
- 合成规则页
- 运营参数页
- 数据看板页
- 用户管理页

由于 vue-vben-admin v5 使用 Shadcn/Vben 组件库，页面代码高度依赖框架的 `VbenTable`, `VbenForm`, `VbenModal` 等内置组件。下面以卡牌管理页为例：

- [ ] **Step 1: 编写卡牌管理页**

`admin/src/views/cards/index.vue`:
```vue
<template>
  <div>
    <VbenTable
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="{ pageSize: 20 }"
      @change="onPageChange"
    >
      <template #toolbar>
        <VbenButton type="primary" @click="openCreate">新增卡牌</VbenButton>
        <VbenButton @click="openBatchImport">批量导入</VbenButton>
      </template>
    </VbenTable>

    <VbenModal v-model:open="modalOpen" :title="modalTitle" @ok="handleSubmit">
      <VbenForm ref="formRef" :model="formData" :schema="formSchema" />
    </VbenModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { cardsApi } from '@/api/cards';

const loading = ref(false);
const dataSource = ref([]);
const modalOpen = ref(false);
const modalTitle = ref('新增卡牌');
const formData = ref({});
const isEditing = ref(false);
const editId = ref<number | null>(null);

const columns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '卡牌ID', dataIndex: 'card_id', width: 150 },
  { title: '名称', dataIndex: 'name', width: 120 },
  { title: '品质', dataIndex: 'quality', width: 80 },
  { title: '朝代', dataIndex: 'dynasty', width: 80 },
  { title: '等级', dataIndex: 'level', width: 60 },
  { title: '类型', dataIndex: 'type', width: 80 },
  { title: '状态', dataIndex: 'is_active', width: 80 },
  { title: '操作', key: 'action', width: 160 },
];

const formSchema = [
  { field: 'card_id', label: '卡牌ID', component: 'Input', required: true },
  { field: 'name', label: '名称', component: 'Input', required: true },
  { field: 'dynasty', label: '朝代', component: 'Input', required: true },
  { field: 'quality', label: '品质', component: 'Select', componentProps: {
    options: [
      { label: '普通', value: 'common' },
      { label: '稀有', value: 'rare' },
      { label: '史诗', value: 'sr' },
      { label: '传说', value: 'ssr' },
      { label: '至宝', value: 'treasure' },
    ]
  }},
  { field: 'level', label: '等级', component: 'InputNumber' },
  { field: 'type', label: '类型', component: 'Select', componentProps: {
    options: [
      { label: '人物', value: 'character' },
      { label: '地点', value: 'place' },
      { label: '事件', value: 'event' },
      { label: '阶段事件', value: 'stage_event' },
    ]
  }},
  { field: 'story', label: '故事', component: 'Textarea' },
  { field: 'image_url', label: '图片URL', component: 'Input' },
];

async function fetchData(page = 1) {
  loading.value = true;
  try {
    const res = await cardsApi.getList({ page, limit: 20 });
    dataSource.value = res.list;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  isEditing.value = false;
  editId.value = null;
  formData.value = {};
  modalTitle.value = '新增卡牌';
  modalOpen.value = true;
}

function openEdit(record: any) {
  isEditing.value = true;
  editId.value = record.id;
  formData.value = { ...record };
  modalTitle.value = '编辑卡牌';
  modalOpen.value = true;
}

async function handleSubmit() {
  if (isEditing.value && editId.value) {
    await cardsApi.update(editId.value, formData.value);
  } else {
    await cardsApi.create(formData.value);
  }
  modalOpen.value = false;
  fetchData();
}

function onPageChange(page: number) {
  fetchData(page);
}

onMounted(() => fetchData());
</script>
```

- [ ] **Step 2: 编写卡池、合成规则、参数、看板、用户管理页面**

这些页面模式相同：Table + Modal Form，仅字段不同。每个遵循 `cards/index.vue` 的结构。

- [ ] **Step 3: 配置路由和菜单**

在 vue-vben-admin 的路由配置中添加菜单项（利用其动态路由权限系统）：
```typescript
{
  path: '/dashboard',
  name: 'Dashboard',
  component: () => import('@/views/dashboard/index.vue'),
  meta: { title: '数据看板', icon: 'dashboard' },
},
{
  path: '/cards',
  name: 'Cards',
  component: () => import('@/views/cards/index.vue'),
  meta: { title: '卡牌管理', icon: 'card' },
},
{
  path: '/pools',
  name: 'Pools',
  component: () => import('@/views/pools/index.vue'),
  meta: { title: '卡池配置', icon: 'pool' },
},
{
  path: '/merge-rules',
  name: 'MergeRules',
  component: () => import('@/views/merge-rules/index.vue'),
  meta: { title: '合成规则', icon: 'merge' },
},
{
  path: '/configs',
  name: 'Configs',
  component: () => import('@/views/configs/index.vue'),
  meta: { title: '运营参数', icon: 'settings' },
},
{
  path: '/users',
  name: 'Users',
  component: () => import('@/views/users/index.vue'),
  meta: { title: '用户管理', icon: 'user', roles: ['super_admin', 'admin'] },
},
```

- [ ] **Step 4: Commit**

```bash
git add admin/src/views/ admin/src/router/
git commit -m "feat: add admin pages - cards, pools, merge-rules, configs, dashboard, users"
```

---

## Phase 5: 部署与迁移

### Task 15: 种子数据 + 生产部署配置

**Files:**
- Modify: `server/src/seed/seed.ts` (扩展：导入现有 JSON 配置)
- Create: `server/Dockerfile`
- Create: `docker-compose.yml` (可选)

- [ ] **Step 1: 扩展种子脚本 - 导入现有 JSON 配置**

修改 `server/src/seed/seed.ts`，增加从 `config/` 目录导入 JSON 数据：

```typescript
import * as fs from 'fs';
import * as path from 'path';

async function importJsonConfigs(app: any) {
  const configDir = path.join(__dirname, '../../config');
  const files = ['cards.json', 'draw_pools.json', 'merge_rules.json',
                  'daily_limits.json', 'duplicate_conversion_rules.json',
                  'dynasty_tags.json', 'weekly_collection_rewards.json'];

  for (const file of files) {
    const filePath = path.join(configDir, file);
    if (!fs.existsSync(filePath)) continue;

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (file === 'cards.json') {
      const cardsRepo = app.get(getRepository(Card));
      for (const card of data) {
        const existing = await cardsRepo.findOne({ where: { card_id: card.card_id } });
        if (!existing) await cardsRepo.save(cardsRepo.create(card));
      }
    }
    // 类似地处理其他 JSON 文件...
  }
  console.log('Config import complete');
}
```

- [ ] **Step 2: 编写 Dockerfile**

`server/Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY .env.production .env
EXPOSE 3000
CMD ["node", "dist/main"]
```

- [ ] **Step 3: 编写 docker-compose.yml（生产用 PostgreSQL + Redis）**

`server/docker-compose.yml`:
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_TYPE=postgres
      - DATABASE_HOST=db
      - DATABASE_PORT=5432
      - DATABASE_USER=guofeng
      - DATABASE_PASSWORD=changeme
      - DATABASE_NAME=guofeng_alchemy
      - REDIS_HOST=redis
      - JWT_SECRET=your-production-secret
    depends_on:
      - db
      - redis

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: guofeng
      POSTGRES_PASSWORD: changeme
      POSTGRES_DB: guofeng_alchemy
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  admin:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ../admin/dist:/usr/share/nginx/html

volumes:
  pgdata:
```

- [ ] **Step 4: 添加 .gitignore**

确保 `server/.gitignore` 包含：
```
dist
node_modules
*.db
uploads/
.env.local
```

- [ ] **Step 5: Commit**

```bash
git add server/Dockerfile server/docker-compose.yml server/src/seed/
git commit -m "feat: add seed importer, Dockerfile, and production config"
```

---

## 实施顺序

| Phase | Task | 依赖 | 可并行 |
|-------|------|------|--------|
| 1 | Task 1: NestJS 初始化 | 无 | - |
| 1 | Task 2: 数据库 + 实体 | Task 1 | - |
| 1 | Task 3: Auth 模块 | Task 2 | - |
| 2 | Task 4: 卡牌 CRUD | Task 3 | 5,6,7 可并行 |
| 2 | Task 5: 卡池 CRUD | Task 3 | 4,6,7 可并行 |
| 2 | Task 6: 合成规则 CRUD | Task 3 | 4,5,7 可并行 |
| 2 | Task 7: 运营参数 | Task 3 | 4,5,6 可并行 |
| 2 | Task 8: 用户管理 | Task 3 | 4,5,6,7 可并行 |
| 3 | Task 9: 数据看板 | Task 4 | 10,11 可并行 |
| 3 | Task 10: 素材管理 | Task 3 | 9,11 可并行 |
| 3 | Task 11: 操作日志 | Task 3 | 9,10 可并行 |
| 4 | Task 12: Admin 初始化 | 无（独立） | - |
| 4 | Task 13: API 请求层 | Task 12 | - |
| 4 | Task 14: Admin 页面 | Task 13 + Task 4-11 | - |
| 5 | Task 15: 部署配置 | Task 1-14 | - |

---

> **完成标准：** NestJS API 在 localhost:3000 运行，Swagger 文档可访问；vue-vben-admin 在 localhost:5173 运行，可登录、管理卡牌、配置卡池和合成规则。开发用 SQLite 零成本，生产切换 PostgreSQL 仅需替换 `.env`。
