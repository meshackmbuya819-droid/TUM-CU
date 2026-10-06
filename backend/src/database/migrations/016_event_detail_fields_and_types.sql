-- TECUMP Migration 016: rich event metadata and UI-compatible event types.
SET NAMES utf8mb4;

ALTER TABLE `events`
  MODIFY COLUMN event_type ENUM(
    'weekly_fellowship','service','sunday_service','fellowship','worship_night',
    'missions','mission','evangelism','high_school_mission','retreat','conference',
    'leadership_summit','bible_study','prayer_retreat','training','agm','sgm','meeting',
    'camp','empowerment','discipleship','graduation_thanksgiving','other'
  ) NOT NULL;

-- Idempotent MySQL column addition: events.speaker
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'events' AND column_name = 'speaker');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576656e7473602041444420434f4c554d4e2060737065616b65726020564152434841522832303029204e554c4c204146544552206465736372697074696f6e USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: events.topic
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'events' AND column_name = 'topic');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576656e7473602041444420434f4c554d4e2060746f7069636020564152434841522832353529204e554c4c20414654455220737065616b6572 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: events.banner_url
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'events' AND column_name = 'banner_url');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576656e7473602041444420434f4c554d4e206062616e6e65725f75726c6020564152434841522835303029204e554c4c20414654455220746f706963 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL index creation: events.idx_events_type_schedule
SET @tecump_idx_exists := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'events' AND index_name = 'idx_events_type_schedule');
SET @tecump_sql := IF(@tecump_idx_exists = 0, CONVERT(0x43524541544520494e44455820606964785f6576656e74735f747970655f7363686564756c6560204f4e20606576656e74736020286576656e745f747970652c2073746172745f617429 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;
