-- ============================================================================
-- TECUMP Migration 011: registration declaration/profile state
-- The authentication service already uses these fields; older schemas did not
-- contain them, causing completed members to be sent back to the declaration
-- page or triggering SQL "unknown column" errors.
-- ============================================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS declaration_accepted BOOLEAN NOT NULL DEFAULT FALSE AFTER baptism_status,
  ADD COLUMN IF NOT EXISTS declaration_accepted_at DATETIME NULL AFTER declaration_accepted,
  ADD COLUMN IF NOT EXISTS declaration_version VARCHAR(20) NULL AFTER declaration_accepted_at,
  ADD COLUMN IF NOT EXISTS declaration_signature VARCHAR(255) NULL AFTER declaration_version,
  ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT FALSE AFTER declaration_signature;

CREATE INDEX idx_users_profile_completion ON users (profile_completed, account_status, id);
