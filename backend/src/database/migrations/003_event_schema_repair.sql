-- TECUMP / TUMCU Migration 003: event schema repair
-- MySQL 8.0.x / Railway compatible.
-- IMPORTANT: MySQL does NOT support ADD COLUMN IF NOT EXISTS or
-- CREATE INDEX IF NOT EXISTS in ALTER/CREATE syntax. This migration uses
-- INFORMATION_SCHEMA + prepared statements so it is safe to rerun.

SET NAMES utf8mb4;

-- Ensure events.status exists.
SET @tecump_sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE `events` ADD COLUMN `status` ENUM(''draft'',''budgeted'',''approved'',''registration_open'',''ongoing'',''completed'',''archived'') NOT NULL DEFAULT ''draft'' AFTER `organized_by`',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'events'
    AND column_name = 'status'
);
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Ensure events.capacity exists.
SET @tecump_sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE `events` ADD COLUMN `capacity` INT NULL AFTER `status`',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'events'
    AND column_name = 'capacity'
);
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Ensure events.registration_deadline exists.
SET @tecump_sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE `events` ADD COLUMN `registration_deadline` DATETIME NULL AFTER `capacity`',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'events'
    AND column_name = 'registration_deadline'
);
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Ensure public schedule index exists.
SET @tecump_sql = (
  SELECT IF(COUNT(*) = 0,
    'CREATE INDEX `idx_events_public_schedule` ON `events` (`status`,`start_at`)',
    'SELECT 1')
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'events'
    AND index_name = 'idx_events_public_schedule'
);
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Ensure location/date index exists.
SET @tecump_sql = (
  SELECT IF(COUNT(*) = 0,
    'CREATE INDEX `idx_events_location_date` ON `events` (`location`,`start_at`)',
    'SELECT 1')
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'events'
    AND index_name = 'idx_events_location_date'
);
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;
