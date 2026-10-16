-- Additive only: preserves existing events, users, and leadership records.
CREATE TABLE IF NOT EXISTS calendar_event_imports (
  id CHAR(36) NOT NULL PRIMARY KEY,
  source_filename VARCHAR(255) NOT NULL,
  extracted_events JSON NOT NULL,
  review_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  uploaded_by CHAR(36) NOT NULL,
  reviewed_by CHAR(36) NULL,
  linked_event_ids JSON NULL,
  review_note VARCHAR(1000) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_calendar_import_status_created (review_status, created_at),
  INDEX idx_calendar_import_uploader (uploaded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
