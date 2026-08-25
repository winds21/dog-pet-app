-- ============================================================
-- 升级 pet_stats 表：新增清洁度和精力值字段
-- 执行前请确保 pet_db 数据库已存在
-- ============================================================

USE pet_db;

-- 检查并添加新字段
-- 清洁度：0-100，越高越干净
ALTER TABLE pet_stats ADD COLUMN IF NOT EXISTS cleanliness INT NOT NULL DEFAULT 80 COMMENT '清洁度' AFTER intimacy;

-- 精力值：0-100，越高精力越充沛
ALTER TABLE pet_stats ADD COLUMN IF NOT EXISTS energy INT NOT NULL DEFAULT 80 COMMENT '精力值' AFTER cleanliness;

-- 最后互动时间戳（用于冷却检查）
ALTER TABLE pet_stats ADD COLUMN IF NOT EXISTS last_feed_at DATETIME NULL COMMENT '最后喂食时间' AFTER energy;
ALTER TABLE pet_stats ADD COLUMN IF NOT EXISTS last_pet_at DATETIME NULL COMMENT '最后抚摸时间' AFTER last_feed_at;
ALTER TABLE pet_stats ADD COLUMN IF NOT EXISTS last_walk_at DATETIME NULL COMMENT '最后散步时间' AFTER last_pet_at;
ALTER TABLE pet_stats ADD COLUMN IF NOT EXISTS last_clean_at DATETIME NULL COMMENT '最后洗澡时间' AFTER last_walk_at;

-- 最后状态衰减时间（用于定时衰减）
ALTER TABLE pet_stats ADD COLUMN IF NOT EXISTS last_decay_at DATETIME NULL COMMENT '最后衰减时间' AFTER last_clean_at;

-- 更新已有数据的默认值
UPDATE pet_stats SET cleanliness = 80, energy = 80 WHERE cleanliness IS NULL;
