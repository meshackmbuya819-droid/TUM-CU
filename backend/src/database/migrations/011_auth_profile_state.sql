-- ============================================================================
-- TECUMP Migration 011: registration declaration/profile state
-- The authentication service already uses these fields; older schemas did not
-- contain them, causing completed members to be sent back to the declaration
-- page or triggering SQL "unknown column" errors.
-- ============================================================================

-- Idempotent MySQL column addition: users.declaration_accepted
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'declaration_accepted');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520607573657273602041444420434f4c554d4e20606465636c61726174696f6e5f61636365707465646020424f4f4c45414e204e4f54204e554c4c2044454641554c542046414c5345204146544552206261707469736d5f737461747573 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: users.declaration_accepted_at
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'declaration_accepted_at');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520607573657273602041444420434f4c554d4e20606465636c61726174696f6e5f61636365707465645f617460204441544554494d45204e554c4c204146544552206465636c61726174696f6e5f6163636570746564 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: users.declaration_version
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'declaration_version');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520607573657273602041444420434f4c554d4e20606465636c61726174696f6e5f76657273696f6e60205641524348415228323029204e554c4c204146544552206465636c61726174696f6e5f61636365707465645f6174 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: users.declaration_signature
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'declaration_signature');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520607573657273602041444420434f4c554d4e20606465636c61726174696f6e5f7369676e61747572656020564152434841522832353529204e554c4c204146544552206465636c61726174696f6e5f76657273696f6e USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: users.profile_completed
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'profile_completed');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520607573657273602041444420434f4c554d4e206070726f66696c655f636f6d706c657465646020424f4f4c45414e204e4f54204e554c4c2044454641554c542046414c5345204146544552206465636c61726174696f6e5f7369676e6174757265 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL index creation: users.idx_users_profile_completion
SET @tecump_idx_exists := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_users_profile_completion');
SET @tecump_sql := IF(@tecump_idx_exists = 0, CONVERT(0x43524541544520494e44455820606964785f75736572735f70726f66696c655f636f6d706c6574696f6e60204f4e2060757365727360202870726f66696c655f636f6d706c657465642c206163636f756e745f7374617475732c20696429 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;
