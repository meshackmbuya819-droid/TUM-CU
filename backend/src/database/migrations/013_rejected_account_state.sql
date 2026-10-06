-- ============================================================================
-- TECUMP Migration 013: rejected registration state
-- Membership rejection already writes account_status='rejected'; older schemas
-- omitted that enum value and caused SQL errors during rejection.
-- ============================================================================

ALTER TABLE users
  MODIFY COLUMN account_status ENUM(
    'active','pending_approval','suspended','inactive','graduated',
    'alumni','archived','deceased','rejected'
  ) NOT NULL DEFAULT 'pending_approval';

CREATE INDEX idx_users_rejected_status ON users (account_status, updated_at, id);
