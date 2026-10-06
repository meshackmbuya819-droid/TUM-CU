-- TECUMP / TUMCU event schema repair
-- Safe for MySQL 8.0.29+ (including MySQL 8.0.46).
-- Adds only optional event columns that may be missing when an older
-- database was created before the operational event migration completed.

SET NAMES utf8mb4;

-- Idempotent MySQL column addition: events.status
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'events' AND column_name = 'status');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576656e7473602041444420434f4c554d4e20607374617475736020454e554d28276472616674272c276275646765746564272c27617070726f766564272c27726567697374726174696f6e5f6f70656e272c276f6e676f696e67272c27636f6d706c65746564272c27617263686976656427290a202020204e4f54204e554c4c2044454641554c542027647261667427204146544552206f7267616e697a65645f6279 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: events.capacity
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'events' AND column_name = 'capacity');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576656e7473602041444420434f4c554d4e206063617061636974796020494e54204e554c4c20414654455220737461747573 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: events.registration_deadline
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'events' AND column_name = 'registration_deadline');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576656e7473602041444420434f4c554d4e2060726567697374726174696f6e5f646561646c696e6560204441544554494d45204e554c4c204146544552206361706163697479 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL index creation: events.idx_events_public_schedule
SET @tecump_idx_exists := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'events' AND index_name = 'idx_events_public_schedule');
SET @tecump_sql := IF(@tecump_idx_exists = 0, CONVERT(0x43524541544520494e44455820606964785f6576656e74735f7075626c69635f7363686564756c6560204f4e20606576656e74736020287374617475732c2073746172745f617429 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL index creation: events.idx_events_location_date
SET @tecump_idx_exists := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'events' AND index_name = 'idx_events_location_date');
SET @tecump_sql := IF(@tecump_idx_exists = 0, CONVERT(0x43524541544520494e44455820606964785f6576656e74735f6c6f636174696f6e5f6461746560204f4e20606576656e74736020286c6f636174696f6e2c2073746172745f617429 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;
