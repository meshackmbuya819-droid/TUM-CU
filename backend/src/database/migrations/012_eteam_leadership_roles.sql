-- ============================================================================
-- TECUMP Migration 012: E-Team leadership roles
-- ============================================================================

INSERT INTO roles (id, code, name, category, is_system_role)
VALUES
  (UUID(), 'noret_chairperson', 'NORET Evangelism Team Chairperson', 'committee', FALSE),
  (UUID(), 'soret_chairperson', 'SORET Evangelism Team Chairperson', 'committee', FALSE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  is_system_role = VALUES(is_system_role);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
  FROM roles r
  JOIN permissions p
 WHERE r.code IN ('noret_chairperson', 'soret_chairperson')
   AND p.code IN (
     'evangelism.view','evangelism.create','evangelism.edit','evangelism.delete',
     'meetings.view','meetings.create',
     'attendance.view','attendance.record',
     'reports.create','reports.view'
   );
