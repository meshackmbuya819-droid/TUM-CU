-- ============================================================================
-- 007_landing_media_backdrops_and_ministries.sql
-- Persistent storage for landing media backdrops & comprehensive ministry management
-- ============================================================================

-- 1. LANDING MEDIA BACKDROPS (Rotating landing page backdrop images)
CREATE TABLE IF NOT EXISTS landing_media_backdrops (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  src VARCHAR(500) NOT NULL,
  title VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order SMALLINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default backdrop slides if table is newly created and empty
INSERT IGNORE INTO landing_media_backdrops (id, src, title, is_active, display_order)
VALUES
  ('backdrop-1', '/tum-gate-monument.jpg', 'TUM Main Entrance Monument & Heritage', 1, 1),
  ('backdrop-2', '/community/community-1.jpg', 'Student Intercession & Prayer Gathering', 1, 2),
  ('backdrop-3', '/community/community-2.jpg', 'Joyful Praise & Worship in Unity', 1, 3),
  ('backdrop-4', '/community/community-3.jpg', 'Christian Fellowship & Discipleship', 1, 4),
  ('backdrop-5', '/community/community-5.jpg', 'Campus Evangelism & Servant Leadership', 1, 5);

-- 2. ENHANCE MINISTRIES FOR COMPREHENSIVE ADMIN MANAGEMENT
-- Idempotent MySQL column addition: ministries.short_name
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ministries' AND column_name = 'short_name');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606d696e69737472696573602041444420434f4c554d4e206073686f72745f6e616d6560205641524348415228353029204e554c4c204146544552206e616d65 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: ministries.category
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ministries' AND column_name = 'category');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606d696e69737472696573602041444420434f4c554d4e206063617465676f727960205641524348415228353029204e4f54204e554c4c2044454641554c542027776f7273686970272041465445522073686f72745f6e616d65 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: ministries.detailed_description
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ministries' AND column_name = 'detailed_description');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606d696e69737472696573602041444420434f4c554d4e206064657461696c65645f6465736372697074696f6e602054455854204e554c4c204146544552206465736372697074696f6e USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: ministries.meeting_day
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ministries' AND column_name = 'meeting_day');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606d696e69737472696573602041444420434f4c554d4e20606d656574696e675f6461796020564152434841522831303029204e554c4c204146544552206465736372697074696f6e USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: ministries.meeting_time
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ministries' AND column_name = 'meeting_time');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606d696e69737472696573602041444420434f4c554d4e20606d656574696e675f74696d656020564152434841522831303029204e554c4c204146544552206d656574696e675f646179 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: ministries.meeting_venue
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ministries' AND column_name = 'meeting_venue');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606d696e69737472696573602041444420434f4c554d4e20606d656574696e675f76656e75656020564152434841522832303029204e554c4c204146544552206d656574696e675f74696d65 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: ministries.contact_info
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ministries' AND column_name = 'contact_info');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606d696e69737472696573602041444420434f4c554d4e2060636f6e746163745f696e666f6020564152434841522832353529204e554c4c204146544552206d656574696e675f76656e7565 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: ministries.is_active
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ministries' AND column_name = 'is_active');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606d696e69737472696573602041444420434f4c554d4e206069735f6163746976656020424f4f4c45414e204e4f54204e554c4c2044454641554c54205452554520414654455220636f6e746163745f696e666f USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: ministries.show_on_landing
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ministries' AND column_name = 'show_on_landing');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606d696e69737472696573602041444420434f4c554d4e206073686f775f6f6e5f6c616e64696e676020424f4f4c45414e204e4f54204e554c4c2044454641554c5420545255452041465445522069735f616374697665 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: ministries.landing_image_url
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ministries' AND column_name = 'landing_image_url');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606d696e69737472696573602041444420434f4c554d4e20606c616e64696e675f696d6167655f75726c6020564152434841522835303029204e554c4c2041465445522073686f775f6f6e5f6c616e64696e67 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: ministries.landing_caption
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ministries' AND column_name = 'landing_caption');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606d696e69737472696573602041444420434f4c554d4e20606c616e64696e675f63617074696f6e6020564152434841522832353529204e554c4c204146544552206c616e64696e675f696d6167655f75726c USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: ministries.display_order
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ministries' AND column_name = 'display_order');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606d696e69737472696573602041444420434f4c554d4e2060646973706c61795f6f726465726020534d414c4c494e54204e4f54204e554c4c2044454641554c542031204146544552206c616e64696e675f63617074696f6e USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;
