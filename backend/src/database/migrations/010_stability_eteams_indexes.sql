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
ALTER TABLE evangelism_teams
  MODIFY COLUMN leader_id CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS code VARCHAR(50) NULL AFTER name,
  ADD COLUMN IF NOT EXISTS motto VARCHAR(255) NULL AFTER description,
  ADD COLUMN IF NOT EXISTS target_mission_area VARCHAR(255) NULL AFTER vision,
  ADD COLUMN IF NOT EXISTS created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER is_active,
  ADD COLUMN IF NOT EXISTS meeting_day VARCHAR(50) NULL AFTER meeting_venue,
  ADD COLUMN IF NOT EXISTS meeting_time VARCHAR(100) NULL AFTER meeting_day,
  ADD COLUMN IF NOT EXISTS banner_image_url VARCHAR(500) NULL AFTER cover_image_url,
  ADD COLUMN IF NOT EXISTS updated_by CHAR(36) NULL AFTER created_at,
  ADD COLUMN IF NOT EXISTS updated_at DATETIME NULL AFTER updated_by;

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
CREATE INDEX idx_users_status_created ON users (account_status, created_at, id);
CREATE INDEX idx_users_name ON users (full_name, id);
CREATE INDEX idx_users_department_year ON users (department, year_of_study, id);
CREATE INDEX idx_memberships_user_status ON memberships (user_id, status, registration_date);
CREATE INDEX idx_memberships_status_year ON memberships (status, spiritual_year_id, user_id);
CREATE INDEX idx_membership_apps_status_created ON membership_applications (status, created_at, id);
CREATE INDEX idx_user_roles_current_role_user ON user_roles (is_current, role_id, user_id);
CREATE INDEX idx_ministry_members_user_ministry ON ministry_members (user_id, ministry_id);
CREATE INDEX idx_attendance_user_checked ON attendance_records (user_id, checked_in_at, id);

-- Public E-Team reads and portal lists.
CREATE INDEX idx_evangelism_teams_active_name ON evangelism_teams (is_active, name);
CREATE INDEX idx_eteam_programmes_team_date ON eteam_programmes (team_id, scheduled_date, id);
CREATE INDEX idx_eteam_gallery_team_date ON eteam_gallery (team_id, event_date, id);
CREATE INDEX idx_eteam_announcements_team_published ON eteam_announcements (team_id, published_at, id);
CREATE INDEX idx_eteam_reports_team_date ON eteam_reports (team_id, activity_date, id);
