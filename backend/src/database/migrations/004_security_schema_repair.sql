-- TECUMP / TUMCU schema consistency repair
-- Idempotent recovery for databases initialized from an older release where
-- security hardening was not recorded/applied. Safe to run repeatedly.

-- Idempotent MySQL column addition: users.failed_login_attempts
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'failed_login_attempts');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520607573657273602041444420434f4c554d4e20606661696c65645f6c6f67696e5f617474656d7074736020534d414c4c494e54204e4f54204e554c4c2044454641554c542030204146544552206c6173745f6c6f67696e5f6174 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: users.locked_until
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'locked_until');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520607573657273602041444420434f4c554d4e20606c6f636b65645f756e74696c60204441544554494d45204e554c4c204146544552206661696c65645f6c6f67696e5f617474656d707473 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: users.password_changed_at
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'password_changed_at');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520607573657273602041444420434f4c554d4e206070617373776f72645f6368616e6765645f617460204441544554494d45204e554c4c204146544552206c6f636b65645f756e74696c USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL index creation: users.idx_users_locked_until
SET @tecump_idx_exists := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_users_locked_until');
SET @tecump_sql := IF(@tecump_idx_exists = 0, CONVERT(0x43524541544520494e44455820606964785f75736572735f6c6f636b65645f756e74696c60204f4e206075736572736020286c6f636b65645f756e74696c29 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

CREATE TABLE IF NOT EXISTS security_events (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NULL,
  event_type VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_secevt_user_v4 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_secevt_user (user_id),
  INDEX idx_secevt_type_created (event_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
