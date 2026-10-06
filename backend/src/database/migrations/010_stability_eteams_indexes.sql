-- ============================================================================
-- TECUMP Migration 010: stability, E-Team schema repair and large-register indexes
-- MySQL 8.x. Run through the normal migration runner.
-- ============================================================================

SET NAMES utf8mb4;

-- E-Team scoped role assignments were already implemented in application code,
-- but the original enum omitted the value.
ALTER TABLE user_roles
  MODIFY COLUMN scope_type ENUM('global','committee','ministry','executive','e_team')
  NOT NULL DEFAULT 'global';

-- Reconcile the E-Team table with the public/portal model. Existing columns are
-- retained; these additions are intentionally additive and UI-neutral.
ALTER TABLE `evangelism_teams`
  MODIFY COLUMN leader_id CHAR(36) NULL;

-- Idempotent MySQL column addition: evangelism_teams.code
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'evangelism_teams' AND column_name = 'code');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576616e67656c69736d5f7465616d73602041444420434f4c554d4e2060636f646560205641524348415228353029204e554c4c204146544552206e616d65 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: evangelism_teams.motto
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'evangelism_teams' AND column_name = 'motto');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576616e67656c69736d5f7465616d73602041444420434f4c554d4e20606d6f74746f6020564152434841522832353529204e554c4c204146544552206465736372697074696f6e USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: evangelism_teams.target_mission_area
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'evangelism_teams' AND column_name = 'target_mission_area');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576616e67656c69736d5f7465616d73602041444420434f4c554d4e20607461726765745f6d697373696f6e5f617265616020564152434841522832353529204e554c4c20414654455220766973696f6e USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: evangelism_teams.created_at
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'evangelism_teams' AND column_name = 'created_at');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576616e67656c69736d5f7465616d73602041444420434f4c554d4e2060637265617465645f617460204441544554494d45204e4f54204e554c4c2044454641554c542043555252454e545f54494d455354414d502041465445522069735f616374697665 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: evangelism_teams.meeting_day
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'evangelism_teams' AND column_name = 'meeting_day');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576616e67656c69736d5f7465616d73602041444420434f4c554d4e20606d656574696e675f64617960205641524348415228353029204e554c4c204146544552206d656574696e675f76656e7565 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: evangelism_teams.meeting_time
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'evangelism_teams' AND column_name = 'meeting_time');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576616e67656c69736d5f7465616d73602041444420434f4c554d4e20606d656574696e675f74696d656020564152434841522831303029204e554c4c204146544552206d656574696e675f646179 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: evangelism_teams.banner_image_url
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'evangelism_teams' AND column_name = 'banner_image_url');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576616e67656c69736d5f7465616d73602041444420434f4c554d4e206062616e6e65725f696d6167655f75726c6020564152434841522835303029204e554c4c20414654455220636f7665725f696d6167655f75726c USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: evangelism_teams.updated_by
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'evangelism_teams' AND column_name = 'updated_by');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576616e67656c69736d5f7465616d73602041444420434f4c554d4e2060757064617465645f627960204348415228333629204e554c4c20414654455220637265617465645f6174 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: evangelism_teams.updated_at
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'evangelism_teams' AND column_name = 'updated_at');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576616e67656c69736d5f7465616d73602041444420434f4c554d4e2060757064617465645f617460204441544554494d45204e554c4c20414654455220757064617465645f6279 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Populate missing codes from the existing team names without overwriting
-- administrator-defined codes.
UPDATE evangelism_teams
SET code = UPPER(REPLACE(REPLACE(name, ' ', '_'), '-', '_'))
WHERE (code IS NULL OR code = '') AND name IS NOT NULL;

-- The application needs stable team codes.
SET @code_idx_exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'evangelism_teams'
    AND index_name = 'uq_evangelism_team_code'
);
SET @sql := IF(@code_idx_exists = 0,
  'ALTER TABLE evangelism_teams ADD UNIQUE KEY uq_evangelism_team_code (code)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Large-register query indexes.
-- Idempotent MySQL index creation: users.idx_users_status_created
SET @tecump_idx_exists := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_users_status_created');
SET @tecump_sql := IF(@tecump_idx_exists = 0, CONVERT(0x43524541544520494e44455820606964785f75736572735f7374617475735f6372656174656460204f4e206075736572736020286163636f756e745f7374617475732c20637265617465645f61742c20696429 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;
-- Idempotent MySQL index creation: users.idx_users_name
SET @tecump_idx_exists := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_users_name');
SET @tecump_sql := IF(@tecump_idx_exists = 0, CONVERT(0x43524541544520494e44455820606964785f75736572735f6e616d6560204f4e2060757365727360202866756c6c5f6e616d652c20696429 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;
-- Idempotent MySQL index creation: users.idx_users_department_year
SET @tecump_idx_exists := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_users_department_year');
SET @tecump_sql := IF(@tecump_idx_exists = 0, CONVERT(0x43524541544520494e44455820606964785f75736572735f6465706172746d656e745f7965617260204f4e206075736572736020286465706172746d656e742c20796561725f6f665f73747564792c20696429 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;
-- Idempotent MySQL index creation: memberships.idx_memberships_user_status
SET @tecump_idx_exists := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'memberships' AND index_name = 'idx_memberships_user_status');
SET @tecump_sql := IF(@tecump_idx_exists = 0, CONVERT(0x43524541544520494e44455820606964785f6d656d62657273686970735f757365725f73746174757360204f4e20606d656d6265727368697073602028757365725f69642c207374617475732c20726567697374726174696f6e5f6461746529 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;
-- Idempotent MySQL index creation: memberships.idx_memberships_status_year
SET @tecump_idx_exists := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'memberships' AND index_name = 'idx_memberships_status_year');
SET @tecump_sql := IF(@tecump_idx_exists = 0, CONVERT(0x43524541544520494e44455820606964785f6d656d62657273686970735f7374617475735f7965617260204f4e20606d656d62657273686970736020287374617475732c2073706972697475616c5f796561725f69642c20757365725f696429 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;
-- Idempotent MySQL index creation: membership_applications.idx_membership_apps_status_created
SET @tecump_idx_exists := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'membership_applications' AND index_name = 'idx_membership_apps_status_created');
SET @tecump_sql := IF(@tecump_idx_exists = 0, CONVERT(0x43524541544520494e44455820606964785f6d656d626572736869705f617070735f7374617475735f6372656174656460204f4e20606d656d626572736869705f6170706c69636174696f6e736020287374617475732c20637265617465645f61742c20696429 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;
-- Idempotent MySQL index creation: user_roles.idx_user_roles_current_role_user
SET @tecump_idx_exists := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'user_roles' AND index_name = 'idx_user_roles_current_role_user');
SET @tecump_sql := IF(@tecump_idx_exists = 0, CONVERT(0x43524541544520494e44455820606964785f757365725f726f6c65735f63757272656e745f726f6c655f7573657260204f4e2060757365725f726f6c657360202869735f63757272656e742c20726f6c655f69642c20757365725f696429 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;
-- Idempotent MySQL index creation: ministry_members.idx_ministry_members_user_ministry
SET @tecump_idx_exists := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'ministry_members' AND index_name = 'idx_ministry_members_user_ministry');
SET @tecump_sql := IF(@tecump_idx_exists = 0, CONVERT(0x43524541544520494e44455820606964785f6d696e69737472795f6d656d626572735f757365725f6d696e697374727960204f4e20606d696e69737472795f6d656d62657273602028757365725f69642c206d696e69737472795f696429 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;
-- Idempotent MySQL index creation: attendance_records.idx_attendance_user_checked
SET @tecump_idx_exists := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'attendance_records' AND index_name = 'idx_attendance_user_checked');
SET @tecump_sql := IF(@tecump_idx_exists = 0, CONVERT(0x43524541544520494e44455820606964785f617474656e64616e63655f757365725f636865636b656460204f4e2060617474656e64616e63655f7265636f726473602028757365725f69642c20636865636b65645f696e5f61742c20696429 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Public E-Team reads and portal lists.
-- Idempotent MySQL index creation: evangelism_teams.idx_evangelism_teams_active_name
SET @tecump_idx_exists := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'evangelism_teams' AND index_name = 'idx_evangelism_teams_active_name');
SET @tecump_sql := IF(@tecump_idx_exists = 0, CONVERT(0x43524541544520494e44455820606964785f6576616e67656c69736d5f7465616d735f6163746976655f6e616d6560204f4e20606576616e67656c69736d5f7465616d7360202869735f6163746976652c206e616d6529 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;
-- Idempotent MySQL index creation: eteam_programmes.idx_eteam_programmes_team_date
SET @tecump_idx_exists := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'eteam_programmes' AND index_name = 'idx_eteam_programmes_team_date');
SET @tecump_sql := IF(@tecump_idx_exists = 0, CONVERT(0x43524541544520494e44455820606964785f657465616d5f70726f6772616d6d65735f7465616d5f6461746560204f4e2060657465616d5f70726f6772616d6d65736020287465616d5f69642c207363686564756c65645f646174652c20696429 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;
-- Idempotent MySQL index creation: eteam_gallery.idx_eteam_gallery_team_date
SET @tecump_idx_exists := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'eteam_gallery' AND index_name = 'idx_eteam_gallery_team_date');
SET @tecump_sql := IF(@tecump_idx_exists = 0, CONVERT(0x43524541544520494e44455820606964785f657465616d5f67616c6c6572795f7465616d5f6461746560204f4e2060657465616d5f67616c6c6572796020287465616d5f69642c206576656e745f646174652c20696429 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;
-- Idempotent MySQL index creation: eteam_announcements.idx_eteam_announcements_team_published
SET @tecump_idx_exists := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'eteam_announcements' AND index_name = 'idx_eteam_announcements_team_published');
SET @tecump_sql := IF(@tecump_idx_exists = 0, CONVERT(0x43524541544520494e44455820606964785f657465616d5f616e6e6f756e63656d656e74735f7465616d5f7075626c697368656460204f4e2060657465616d5f616e6e6f756e63656d656e74736020287465616d5f69642c207075626c69736865645f61742c20696429 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;
-- Idempotent MySQL index creation: eteam_reports.idx_eteam_reports_team_date
SET @tecump_idx_exists := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'eteam_reports' AND index_name = 'idx_eteam_reports_team_date');
SET @tecump_sql := IF(@tecump_idx_exists = 0, CONVERT(0x43524541544520494e44455820606964785f657465616d5f7265706f7274735f7465616d5f6461746560204f4e2060657465616d5f7265706f7274736020287465616d5f69642c2061637469766974795f646174652c20696429 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;
