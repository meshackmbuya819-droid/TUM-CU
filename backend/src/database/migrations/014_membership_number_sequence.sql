-- ============================================================================
-- TECUMP Migration 014: concurrency-safe membership numbering
-- Prevents duplicate membership numbers when multiple approvals happen at once.
-- ============================================================================

CREATE TABLE IF NOT EXISTS membership_number_sequences (
  year SMALLINT NOT NULL PRIMARY KEY,
  next_number INT NOT NULL DEFAULT 1,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
