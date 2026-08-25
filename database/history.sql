-- ============================================================
-- 狗狗状态历史快照表（用于折线图展示一周趋势）
-- 每天最多记录一条，按 record_date 唯一
-- ============================================================

CREATE TABLE IF NOT EXISTS pet_db.pet_stats_history (
    id            INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    record_date   DATE NOT NULL COMMENT '记录日期',
    satiety       INT NOT NULL DEFAULT 50 COMMENT '当日饱食度',
    happiness     INT NOT NULL DEFAULT 50 COMMENT '当日愉悦度',
    intimacy      INT NOT NULL DEFAULT 50 COMMENT '当日亲密度',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_record_date (record_date) COMMENT '按日期唯一，防止重复'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='狗狗状态历史快照';
