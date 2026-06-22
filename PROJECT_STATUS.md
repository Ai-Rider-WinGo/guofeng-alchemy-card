# Project Status

Last updated: 2026-06

Current stage: **Pre-Alpha / Early Alpha**

## Executive Summary

`国风炼金卡牌` is a Web/H5-first historical card collection game. The project has moved beyond planning: the repository now contains a player-facing Next.js app, a NestJS API server, a lightweight Vue admin console, shared gameplay configuration, database entities, seed scripts, and AI asset generation tooling.

The formal client direction is **Web/H5 only**. Douyin mini-game delivery should be handled through H5 adaptation. `client/cocos-client/` is retained only as an **Archived Prototype** and is not part of the future production client plan.

## Current Architecture

```text
web/ Web/H5 client
  -> Next.js 16 + React 19
  -> /api rewrites
  -> server/ NestJS API
  -> SQLite in development / PostgreSQL planned for production

admin-light/ lightweight admin console
  -> Vue 3 + Ant Design Vue
  -> /api proxy
  -> server/ admin APIs

config/
  -> shared game configuration
  -> cards, pools, merge rules, daily limits, dynasties, rewards

client/cocos-client/
  -> Archived Prototype
  -> historical Cocos Creator prototype only
```

API documentation:

```text
http://localhost:3002/api/docs
```

## Monorepo Map

| Path | Status | Purpose |
| --- | --- | --- |
| `web/` | Active | Official Web/H5 player client |
| `server/` | Active | NestJS API, player runtime, admin APIs, TypeORM entities |
| `admin-light/` | Active | Lightweight Vue admin console |
| `config/` | Active | Shared gameplay JSON configuration |
| `db/` | Draft | Database notes and migration draft |
| `docs/` | Active | Product, architecture, MVP, roadmap and technical docs |
| `assets-source/` | Active prototype | AI asset prompts and source references |
| `prototype/` | Reference | UI screenshots and visual validation artifacts |
| `client/cocos-client/` | Archived Prototype | Historical Cocos prototype, no further formal development |
| `*.py`, `*.ipynb` | Active prototype | AI card generation, batch scripts and notebooks |

## Startup Commands

Backend API:

```bash
cd server
npm install
npm run seed
npm run start:dev
```

Player Web/H5 client:

```bash
cd web
npm install
npm run dev
```

Admin console:

```bash
cd admin-light
npm install
npm run dev
```

Default development ports:

| Module | Port | Notes |
| --- | --- | --- |
| `server` | `3002` | NestJS API and Swagger docs |
| `web` | Next.js default | Proxies `/api/*` to `API_TARGET`, default `http://localhost:3002` |
| `admin-light` | `5173` | Proxies `/api` to `http://localhost:3002` |
| `card_server.py` | `8888` | Optional generated asset server for `/assets-output` |

## Environment Variables

Backend development:

```text
NODE_ENV=development
PORT=3002
DATABASE_TYPE=sqlite
DATABASE_URL=./data2.db
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
```

Backend production plan:

```text
NODE_ENV=production
PORT=3000
DATABASE_TYPE=postgres
DATABASE_HOST=your-pg-host
DATABASE_PORT=5432
DATABASE_USER=your-user
DATABASE_PASSWORD=your-password
DATABASE_NAME=guofeng_alchemy
REDIS_HOST=your-redis-host
REDIS_PORT=6379
JWT_SECRET=your-secure-random-secret
JWT_EXPIRES_IN=7d
UPLOAD_DIR=/data/uploads
```

Web client:

```text
API_TARGET=http://localhost:3002
```

## Database Status

Current development database:

- SQLite via TypeORM.
- Default local database file: `server/data2.db`.
- Seed script: `server/src/seed/seed.ts`.
- Entities live under `server/src/database/entities/`.

Production database plan:

- PostgreSQL.
- Redis appears in production configuration and Docker Compose, but is not yet wired into active NestJS modules.

Important production blocker:

- TypeORM currently uses `synchronize: true`. Production launch requires formal migrations, rollback strategy, seed discipline, backups, and environment separation.

## Implemented Modules

Player Web/H5:

- Home page.
- Draw page.
- Merge page.
- Collection page.
- Card detail page.
- Gallery.
- Leaderboard.
- Login.
- Profile.
- Sign-in.
- Tasks.
- API client wrappers for player runtime endpoints.

Backend API:

- NestJS application shell.
- Global API prefix: `/api`.
- Swagger documentation: `/api/docs`.
- CORS, validation pipe and response transform.
- Admin auth and JWT.
- Player auth and JWT.
- Cards management.
- Pools management.
- Merge rules management.
- Config management.
- Users management.
- Dashboard.
- Assets.
- Audit logs.
- Public data.
- Image jobs.
- Game draw.
- Game merge.
- Game daily/sign-in.

Admin console:

- Login.
- Dashboard.
- Cards.
- Pools.
- Configs.
- Merge rules.
- Prompt rules.
- Users.

Data and content:

- Card import from `import_cards.json` and `config/cards.json`.
- Draw pool configuration.
- Merge rule configuration.
- Daily limit configuration.
- Dynasty tags.
- Duplicate conversion rules.
- Weekly collection rewards.
- AI image generation scripts, references and previews.

## MVP Completion Assessment

| Area | Status | Assessment |
| --- | --- | --- |
| Product direction | Mostly complete | MVP loop and feature scope are clear |
| Web/H5 client | Partial | Core pages exist; mobile and Douyin H5 adaptation still need hardening |
| Backend runtime | Partial | Core API modules exist; production hardening remains |
| Admin console | Partial | Lightweight CRUD/admin surfaces exist; permissions and release workflows need work |
| Database | Development-ready | SQLite works for dev; PostgreSQL production path needs migrations |
| Game economy | Partial | Draw/merge/fragments exist; probability, rewards and failure cases need tests |
| Douyin mini-game route | Planned | H5 adaptation is the target; platform APIs are not integrated yet |
| Cocos route | Archived | Historical prototype only |
| AI asset pipeline | Prototype | Scripts and references exist; production asset publishing is missing |

## Current Risks

- No production migration system yet.
- `synchronize: true` is unsafe for production.
- Douyin login, share, payment, rewarded ads, analytics and review constraints are not integrated.
- Redis is configured as a production expectation but not implemented in server modules.
- Core economy behavior needs automated tests: draw probability, pity, inventory changes, merge failure rollback, rewards and daily limits.
- Admin permissions, audit completeness, config publish/rollback and release workflow are not production-ready.
- Object storage and CDN are not integrated for card images and generated assets.
- `.env.example` is missing; environment documentation is still scattered across committed env files and docs.
- CI, deployment, observability, rate limiting and rollback procedures remain incomplete.

## Production Launch Gaps

Required before production:

- Replace TypeORM `synchronize: true` with migrations.
- Add `.env.example` and formal secret handling.
- Complete PostgreSQL setup, migration, backup and recovery flow.
- Integrate Douyin platform login.
- Integrate rewarded ad verification.
- Integrate payment order creation, callback verification and compensation flow.
- Add rate limiting, anti-abuse checks and draw/merge fraud protection.
- Add object storage and CDN pipeline for images.
- Add automated test coverage for gameplay economy.
- Add CI checks for `web`, `server` and `admin-light`.
- Add production deployment docs.
- Add logs, metrics, error tracking and alerting.
- Harden admin roles, permissions and audit trails.
- Prepare H5 mini-game device testing and platform review checklist.

## Recommended Next Actions

1. Create `.env.example` for `server`, `web` and `admin-light` assumptions.
2. Add database migration scaffolding and remove production dependence on `synchronize: true`.
3. Build a minimal end-to-end test path: register/login, draw, inventory, fragments, merge, sign-in.
4. Define H5/Douyin platform adapter interfaces for login, share, rewarded ads, payment and analytics.
5. Add CI commands for TypeScript/build checks across `web`, `server` and `admin-light`.
6. Define the asset publishing path from generated image to object storage/CDN to `image_url`.
7. Expand admin permissions and configuration publish/rollback design.

## Status Labels

- Active formal client: `web/`.
- Formal platform route: Web/H5 adapted for Douyin mini-game.
- Archived client prototype: `client/cocos-client/`.
- Current phase: Pre-Alpha / Early Alpha.
- Production readiness: not ready.
