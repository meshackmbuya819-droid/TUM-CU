-- ============================================================================
-- 007_landing_media_backdrops_and_ministries.sql
-- Persistent storage for landing media backdrops & comprehensive ministry management
-- ============================================================================

-- 1. LANDING MEDIA BACKDROPS (Rotating landing page backdrop images)
CREATE TABLE IF NOT EXISTS landing_media_backdrops (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  src VARCHAR(500) NOT NULL,
  title VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order SMALLINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default backdrop slides if table is newly created and empty
INSERT IGNORE INTO landing_media_backdrops (id, src, title, is_active, display_order)
VALUES
  ('backdrop-1', '/tum-gate-monument.jpg', 'TUM Main Entrance Monument & Heritage', 1, 1),
  ('backdrop-2', '/community/community-1.jpg', 'Student Intercession & Prayer Gathering', 1, 2),
  ('backdrop-3', '/community/community-2.jpg', 'Joyful Praise & Worship in Unity', 1, 3),
  ('backdrop-4', '/community/community-3.jpg', 'Christian Fellowship & Discipleship', 1, 4),
  ('backdrop-5', '/community/community-5.jpg', 'Campus Evangelism & Servant Leadership', 1, 5);

-- 2. ENHANCE MINISTRIES FOR COMPREHENSIVE ADMIN MANAGEMENT
ALTER TABLE ministries
  ADD COLUMN IF NOT EXISTS short_name VARCHAR(50) NULL AFTER name,
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) NOT NULL DEFAULT 'worship' AFTER short_name,
  ADD COLUMN IF NOT EXISTS detailed_description TEXT NULL AFTER description,
  ADD COLUMN IF NOT EXISTS meeting_day VARCHAR(100) NULL AFTER description,
  ADD COLUMN IF NOT EXISTS meeting_time VARCHAR(100) NULL AFTER meeting_day,
  ADD COLUMN IF NOT EXISTS meeting_venue VARCHAR(200) NULL AFTER meeting_time,
  ADD COLUMN IF NOT EXISTS contact_info VARCHAR(255) NULL AFTER meeting_venue,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER contact_info,
  ADD COLUMN IF NOT EXISTS show_on_landing BOOLEAN NOT NULL DEFAULT TRUE AFTER is_active,
  ADD COLUMN IF NOT EXISTS landing_image_url VARCHAR(500) NULL AFTER show_on_landing,
  ADD COLUMN IF NOT EXISTS landing_caption VARCHAR(255) NULL AFTER landing_image_url,
  ADD COLUMN IF NOT EXISTS display_order SMALLINT NOT NULL DEFAULT 1 AFTER landing_caption;
