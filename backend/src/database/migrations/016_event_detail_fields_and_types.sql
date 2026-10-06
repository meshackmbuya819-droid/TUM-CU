-- TECUMP Migration 016: rich event metadata and UI-compatible event types.
SET NAMES utf8mb4;

ALTER TABLE events
  MODIFY COLUMN event_type ENUM(
    'weekly_fellowship','service','sunday_service','fellowship','worship_night',
    'missions','mission','evangelism','high_school_mission','retreat','conference',
    'leadership_summit','bible_study','prayer_retreat','training','agm','sgm','meeting',
    'camp','empowerment','discipleship','graduation_thanksgiving','other'
  ) NOT NULL,
  ADD COLUMN IF NOT EXISTS speaker VARCHAR(200) NULL AFTER description,
  ADD COLUMN IF NOT EXISTS topic VARCHAR(255) NULL AFTER speaker,
  ADD COLUMN IF NOT EXISTS banner_url VARCHAR(500) NULL AFTER topic;

CREATE INDEX idx_events_type_schedule ON events (event_type, start_at);
