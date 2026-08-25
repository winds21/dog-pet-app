-- ============================================================
-- 狗狗养成互动项目 - 数据库初始化脚本
-- 数据库: pet_db   表: pet_stats
-- ============================================================

CREATE DATABASE IF NOT EXISTS pet_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE pet_db;

-- 注意：初始化会重建表。若存在旧结构表（如 hunger 字段版本），先删除再重建
DROP TABLE IF EXISTS pet_stats;

-- 狗狗状态表
CREATE TABLE IF NOT EXISTS pet_stats (
    id          INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    pet_name    VARCHAR(50) NOT NULL DEFAULT '旺财' COMMENT '狗狗名字',
    satiety     INT NOT NULL DEFAULT 50 COMMENT '饱食度 (0-100)',
    happiness   INT NOT NULL DEFAULT 50 COMMENT '愉悦度 (0-100)',
    intimacy    INT NOT NULL DEFAULT 50 COMMENT '亲密度 (0-100)',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='狗狗状态表';

-- 插入一条默认狗狗数据（如已存在则跳过）
INSERT INTO pet_stats (pet_name, satiety, happiness, intimacy)
SELECT '旺财', 50, 50, 50
WHERE NOT EXISTS (SELECT 1 FROM pet_stats WHERE id = 1);

-- 查看初始化结果
SELECT * FROM pet_stats;
