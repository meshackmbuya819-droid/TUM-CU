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

-- Idempotent MySQL index creation: users.idx_users_rejected_status
SET @tecump_idx_exists := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_users_rejected_status');
SET @tecump_sql := IF(@tecump_idx_exists = 0, CONVERT(0x43524541544520494e44455820606964785f75736572735f72656a65637465645f73746174757360204f4e206075736572736020286163636f756e745f7374617475732c20757064617465645f61742c20696429 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;
