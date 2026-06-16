-- 国风炼金卡牌 · 初始 Schema
-- Version: 001_initial
-- Description: 核心用户与卡牌系统表结构

-- ⚠️ 此为设计草案占位，等待数据库引擎选型后改造为具体迁移语法。

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    uid             VARCHAR(64) UNIQUE NOT NULL,     -- 抖音/平台 UID
    nickname        VARCHAR(100),
    avatar_url      TEXT,
    vip_level       INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 用户持有卡牌
CREATE TABLE IF NOT EXISTS user_cards (
    id              SERIAL PRIMARY KEY,
    user_id         INT REFERENCES users(id),
    card_id         VARCHAR(32) NOT NULL,            -- 卡牌定义 ID
    quantity        INT DEFAULT 1,                   -- 持有数量
    star_level      INT DEFAULT 1,                   -- 当前星级
    obtained_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, card_id)
);

-- 用户碎片
CREATE TABLE IF NOT EXISTS user_fragments (
    id              SERIAL PRIMARY KEY,
    user_id         INT REFERENCES users(id),
    fragment_type   VARCHAR(32) NOT NULL,            -- 碎片类型 (dynasty/rarity)
    fragment_id     VARCHAR(32) NOT NULL,            -- 具体朝代/稀有度
    quantity        INT DEFAULT 0,
    UNIQUE(user_id, fragment_type, fragment_id)
);

-- 卡牌定义表（玩法数据，对应 design 分支 config/cards.json）
-- 图片存于 CDN，此处只存 URL 引用
CREATE TABLE IF NOT EXISTS cards (
    id              SERIAL PRIMARY KEY,
    card_id         VARCHAR(32) UNIQUE NOT NULL,
    name            VARCHAR(100) NOT NULL,
    level           INT NOT NULL,
    type            VARCHAR(16) NOT NULL,           -- person/event/weapon/book/place/dynasty
    dynasty         VARCHAR(50) NOT NULL,
    dynasty_tag     VARCHAR(32) NOT NULL,
    rarity          VARCHAR(8) NOT NULL,            -- N/R/SR/SSR/UR
    tags            JSONB DEFAULT '[]',
    short_desc      TEXT,
    story           TEXT,
    knowledge_point TEXT,
    related_cards   JSONB DEFAULT '[]',
    merge_paths     JSONB DEFAULT '[]',
    star_max        INT DEFAULT 5,
    image_url       TEXT NOT NULL,                  -- CDN URL: {CDN_BASE}/cards/{dynasty_tag}/{card_id}.png
    thumbnail_url   TEXT NOT NULL,                  -- CDN URL: {CDN_BASE}/cards/{dynasty_tag}/{card_id}_thumb.png
    is_final        BOOLEAN DEFAULT FALSE,
    final_desc      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 卡池定义表
CREATE TABLE IF NOT EXISTS draw_pools (
    id              SERIAL PRIMARY KEY,
    pool_id         VARCHAR(32) UNIQUE NOT NULL,
    name            VARCHAR(100) NOT NULL,
    pool_type       VARCHAR(32) NOT NULL,           -- permanent / weekly_dynasty / limited_premium
    dynasty_tag     VARCHAR(32),
    rarity_weights  JSONB NOT NULL,
    featured_card_ids JSONB DEFAULT '[]',
    pity_config     JSONB NOT NULL,
    ticket_type     VARCHAR(32) NOT NULL,
    active          BOOLEAN DEFAULT FALSE,
    rotation_week   INT,
    duration_days   INT DEFAULT 7,
    mvp_launch      BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 卡池排期表
CREATE TABLE IF NOT EXISTS pool_schedules (
    id              SERIAL PRIMARY KEY,
    pool_id         VARCHAR(32) NOT NULL,
    dynasty_tag     VARCHAR(32) NOT NULL,
    theme_name      VARCHAR(100) NOT NULL,
    start_at        TIMESTAMPTZ NOT NULL,
    end_at          TIMESTAMPTZ NOT NULL,
    is_active       BOOLEAN DEFAULT FALSE
);

-- 保底计数器
CREATE TABLE IF NOT EXISTS user_pity_counters (
    id              SERIAL PRIMARY KEY,
    user_id         INT REFERENCES users(id),
    pool_id         VARCHAR(32) NOT NULL,
    draw_count      INT DEFAULT 0,
    ssr_pity        INT DEFAULT 0,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, pool_id)
);

-- 图鉴收集
CREATE TABLE IF NOT EXISTS user_collections (
    id              SERIAL PRIMARY KEY,
    user_id         INT REFERENCES users(id),
    card_id         VARCHAR(32) NOT NULL,
    collected_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, card_id)
);

-- 抽卡历史
CREATE TABLE IF NOT EXISTS user_draw_history (
    id              SERIAL PRIMARY KEY,
    user_id         INT REFERENCES users(id),
    pool_id         VARCHAR(32) NOT NULL,
    card_id         VARCHAR(32) NOT NULL,
    rarity          VARCHAR(8) NOT NULL,
    is_new          BOOLEAN DEFAULT TRUE,
    draw_type       VARCHAR(16) DEFAULT 'single',    -- single / ten_draw
    drew_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_user_cards_user ON user_cards(user_id);
CREATE INDEX idx_user_collections_user ON user_collections(user_id);
CREATE INDEX idx_draw_history_user ON user_draw_history(user_id, drew_at);
