-- TECUMP Migration 015: communication inbox, production leadership persistence,
-- E-Team naming normalization and durable media configuration.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS contact_messages (
  id CHAR(36) NOT NULL PRIMARY KEY,
  sender_name VARCHAR(150) NOT NULL,
  sender_email VARCHAR(190) NOT NULL,
  sender_phone VARCHAR(30) NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('new','read','replied','archived') NOT NULL DEFAULT 'new',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME NULL,
  replied_at DATETIME NULL,
  assigned_to CHAR(36) NULL,
  INDEX idx_contact_status_created (status, created_at),
  INDEX idx_contact_sender_email (sender_email),
  CONSTRAINT fk_contact_assignee FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS leadership_positions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  category ENUM('executive','committee','ministry','ad_hoc') NOT NULL,
  description TEXT NULL,
  constitutional_reference VARCHAR(100) NULL,
  is_executive BOOLEAN NOT NULL DEFAULT FALSE,
  requires_gender_rule BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order SMALLINT NOT NULL DEFAULT 1,
  responsibilities JSON NULL,
  permissions JSON NULL,
  constitutional_restrictions JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_leadership_positions_active_order (active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS leadership_assignments (
  id CHAR(36) NOT NULL PRIMARY KEY,
  position_id CHAR(36) NOT NULL,
  user_id CHAR(36) NULL,
  academic_year VARCHAR(20) NOT NULL,
  assignment_type ENUM('permanent','acting','co-opted','temporary') NOT NULL DEFAULT 'permanent',
  start_date DATE NOT NULL,
  end_date DATE NULL,
  status ENUM('active','vacant','ended','suspended') NOT NULL DEFAULT 'active',
  vacancy_reason VARCHAR(255) NULL,
  vacancy_date DATE NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_la_position FOREIGN KEY (position_id) REFERENCES leadership_positions(id) ON DELETE RESTRICT,
  CONSTRAINT fk_la_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_la_position_status (position_id, status),
  INDEX idx_la_user_status (user_id, status),
  INDEX idx_la_year_status (academic_year, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ensure the constitutional welfare role exists for the leadership directory.
INSERT INTO roles (id, code, name, category, is_system_role)
VALUES (UUID(), 'welfare_chairperson', 'Welfare Committee Chairperson', 'committee', FALSE)
ON DUPLICATE KEY UPDATE name = VALUES(name), category = VALUES(category);

-- Canonical E-Team public names requested by TUMCU. Codes remain stable so
-- existing assignments and links are not broken.
UPDATE evangelism_teams SET name = 'NET MINISTRIES TRUST TUM UNIT' WHERE code = 'NORET';
UPDATE evangelism_teams SET name = 'NORET-SORET' WHERE code = 'SORET';

-- Add missing media/leadership metadata columns where an older database lacks them.
-- Idempotent MySQL column addition: users.bio
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'bio');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520607573657273602041444420434f4c554d4e206062696f602054455854204e554c4c2041465445522070617373706f72745f70686f746f5f75726c USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Make the primary landing media row deterministic if it does not yet exist.
INSERT IGNORE INTO landing_media_config
  (id, rotate_interval_ms, background_src, background_opacity, background_blur_px, background_title)
VALUES ('main', 4000, '/tum-gate-monument.jpg', 0.80, 1, 'TUM Main Entrance Gate Monument');
