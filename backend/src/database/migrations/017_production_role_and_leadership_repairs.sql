-- TECUMP Migration 017: production RBAC and leadership consistency repairs
SET NAMES utf8mb4;

-- Existing deployments may have been seeded before contact inbox permissions
-- were added to the constitutional leadership roles.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
WHERE r.code = 'secretary' AND p.code IN ('communication.view','communication.create','communication.edit');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
WHERE r.code = 'chairperson' AND p.code IN ('communication.view','communication.create');

-- E-Team portal routes require these exact permissions. Earlier deployments
-- granted only evangelism.* permissions, which made the portal appear but
-- rejected every management action after login.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
WHERE r.code IN ('noret_chairperson','soret_chairperson')
  AND p.code IN (
    'eteams.view','eteams.manage_team','eteams.manage_programmes',
    'eteams.manage_gallery','eteams.manage_reports','eteams.manage_announcements',
    'reports.view','reports.create','meetings.view','events.view',
    'prayer.view','prayer.create','finance.request','attendance.record'
  );

-- E-Team roles are scoped to a specific team. Keep the scope type available
-- even on databases created from the earliest core migration.
ALTER TABLE user_roles
  MODIFY COLUMN scope_type ENUM('global','committee','ministry','executive','e_team') NOT NULL DEFAULT 'global';

-- Canonical public team names; codes remain stable for URLs and role mapping.
UPDATE evangelism_teams SET name = 'NET MINISTRIES TRUST TUM UNIT' WHERE code = 'NORET';
UPDATE evangelism_teams SET name = 'NORET-SORET' WHERE code = 'SORET';
