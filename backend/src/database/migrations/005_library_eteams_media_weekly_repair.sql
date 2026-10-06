-- ============================================================================
-- TECUMP / TUMCU Migration 005: Library, E-Teams, Landing Media, Ministry Media,
-- Weekly Programmes & Member Gallery Schema Unification
-- Safe for MySQL 8.0.29+ and Hostinger cloud instances. Idempotent.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. RECONCILE WEEKLY PROGRAMMES
-- Accommodate day, title, time, venue, leader, description, active, display_order
-- Idempotent MySQL column addition: weekly_programmes.day
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'weekly_programmes' AND column_name = 'day');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520607765656b6c795f70726f6772616d6d6573602041444420434f4c554d4e206064617960205641524348415228323029204e4f54204e554c4c2044454641554c54202753756e64617927204146544552206964 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: weekly_programmes.title
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'weekly_programmes' AND column_name = 'title');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520607765656b6c795f70726f6772616d6d6573602041444420434f4c554d4e20607469746c656020564152434841522832303029204e4f54204e554c4c2044454641554c54202746656c6c6f77736869702050726f6772616d2720414654455220646179 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: weekly_programmes.time
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'weekly_programmes' AND column_name = 'time');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520607765656b6c795f70726f6772616d6d6573602041444420434f4c554d4e206074696d656020564152434841522831303029204e4f54204e554c4c2044454641554c542027353a303020504d202d20373a303020504d272041465445522070726f6772616d6d655f74797065 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: weekly_programmes.leader
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'weekly_programmes' AND column_name = 'leader');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520607765656b6c795f70726f6772616d6d6573602041444420434f4c554d4e20606c65616465726020564152434841522831353029204e554c4c2041465445522076656e7565 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: weekly_programmes.description
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'weekly_programmes' AND column_name = 'description');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520607765656b6c795f70726f6772616d6d6573602041444420434f4c554d4e20606465736372697074696f6e602054455854204e554c4c204146544552206c6561646572 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: weekly_programmes.is_active
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'weekly_programmes' AND column_name = 'is_active');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520607765656b6c795f70726f6772616d6d6573602041444420434f4c554d4e206069735f6163746976656020424f4f4c45414e204e4f54204e554c4c2044454641554c542054525545204146544552206465736372697074696f6e USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: weekly_programmes.display_order
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'weekly_programmes' AND column_name = 'display_order');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520607765656b6c795f70726f6772616d6d6573602041444420434f4c554d4e2060646973706c61795f6f726465726020534d414c4c494e54204e4f54204e554c4c2044454641554c5420312041465445522069735f616374697665 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: weekly_programmes.alternating_mode
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'weekly_programmes' AND column_name = 'alternating_mode');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520607765656b6c795f70726f6772616d6d6573602041444420434f4c554d4e2060616c7465726e6174696e675f6d6f64656020454e554d28276e6f6e65272c276d6f6e6461795f616c7465726e617465272c27637573746f6d2729204e4f54204e554c4c2044454641554c5420276e6f6e652720414654455220646973706c61795f6f72646572 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: weekly_programmes.updated_at
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'weekly_programmes' AND column_name = 'updated_at');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520607765656b6c795f70726f6772616d6d6573602041444420434f4c554d4e2060757064617465645f617460204441544554494d45204e554c4c20414654455220637265617465645f6174 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Allow scheduled_at and created_by to be nullable if used in simple weekly schedule mode
ALTER TABLE weekly_programmes
  MODIFY COLUMN scheduled_at DATETIME NULL,
  MODIFY COLUMN created_by CHAR(36) NULL;

-- 2. ENHANCE MINISTRIES FOR PERSISTENT BACKGROUND & BRANDING
-- Idempotent MySQL column addition: ministries.background_image_url
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ministries' AND column_name = 'background_image_url');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606d696e69737472696573602041444420434f4c554d4e20606261636b67726f756e645f696d6167655f75726c6020564152434841522835303029204e554c4c204146544552206465736372697074696f6e USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: ministries.photo_url
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ministries' AND column_name = 'photo_url');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606d696e69737472696573602041444420434f4c554d4e206070686f746f5f75726c6020564152434841522835303029204e554c4c204146544552206261636b67726f756e645f696d6167655f75726c USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: ministries.leader_id
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ministries' AND column_name = 'leader_id');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606d696e69737472696573602041444420434f4c554d4e20606c65616465725f696460204348415228333629204e554c4c2041465445522070686f746f5f75726c USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: ministries.meeting_time
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ministries' AND column_name = 'meeting_time');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606d696e69737472696573602041444420434f4c554d4e20606d656574696e675f74696d656020564152434841522831303029204e554c4c204146544552206c65616465725f6964 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: ministries.meeting_venue
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ministries' AND column_name = 'meeting_venue');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606d696e69737472696573602041444420434f4c554d4e20606d656574696e675f76656e75656020564152434841522832303029204e554c4c204146544552206d656574696e675f74696d65 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: ministries.updated_at
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ministries' AND column_name = 'updated_at');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606d696e69737472696573602041444420434f4c554d4e2060757064617465645f617460204441544554494d45204e554c4c USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- 3. ENHANCE LIBRARY RESOURCES FOR PHYSICAL & DIGITAL LIBRARY
-- Idempotent MySQL column addition: library_resources.isbn
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_resources' AND column_name = 'isbn');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f7265736f7572636573602041444420434f4c554d4e20606973626e60205641524348415228353029204e554c4c2041465445522063617465676f7279 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: library_resources.description
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_resources' AND column_name = 'description');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f7265736f7572636573602041444420434f4c554d4e20606465736372697074696f6e602054455854204e554c4c204146544552206973626e USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: library_resources.cover_image_url
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_resources' AND column_name = 'cover_image_url');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f7265736f7572636573602041444420434f4c554d4e2060636f7665725f696d6167655f75726c6020564152434841522835303029204e554c4c204146544552206465736372697074696f6e USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: library_resources.shelf_location
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_resources' AND column_name = 'shelf_location');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f7265736f7572636573602041444420434f4c554d4e20607368656c665f6c6f636174696f6e6020564152434841522831303029204e554c4c20414654455220636f7665725f696d6167655f75726c USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: library_resources.condition_status
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_resources' AND column_name = 'condition_status');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f7265736f7572636573602041444420434f4c554d4e2060636f6e646974696f6e5f7374617475736020454e554d2827657863656c6c656e74272c27676f6f64272c2766616972272c276e656564735f7265706169722729204e4f54204e554c4c2044454641554c542027676f6f6427204146544552207368656c665f6c6f636174696f6e USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: library_resources.borrowed_count
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_resources' AND column_name = 'borrowed_count');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f7265736f7572636573602041444420434f4c554d4e2060626f72726f7765645f636f756e746020494e54204e4f54204e554c4c2044454641554c54203020414654455220636f6e646974696f6e5f737461747573 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: library_resources.librarian_notes
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_resources' AND column_name = 'librarian_notes');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f7265736f7572636573602041444420434f4c554d4e20606c696272617269616e5f6e6f746573602054455854204e554c4c20414654455220626f72726f7765645f636f756e74 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: library_resources.status
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_resources' AND column_name = 'status');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f7265736f7572636573602041444420434f4c554d4e20607374617475736020454e554d2827617661696c61626c65272c276d61696e74656e616e6365272c2761726368697665642729204e4f54204e554c4c2044454641554c542027617661696c61626c6527204146544552206c696272617269616e5f6e6f746573 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: library_resources.updated_at
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_resources' AND column_name = 'updated_at');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f7265736f7572636573602041444420434f4c554d4e2060757064617465645f617460204441544554494d45204e554c4c USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- 4. ENHANCE LIBRARY BORROWINGS
-- Idempotent MySQL column addition: library_borrowings.status
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_borrowings' AND column_name = 'status');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f626f72726f77696e6773602041444420434f4c554d4e20607374617475736020454e554d2827616374697665272c2772657475726e6564272c276f7665726475652729204e4f54204e554c4c2044454641554c54202761637469766527204146544552206f7665726475655f6e6f746963655f73656e74 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: library_borrowings.notes
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_borrowings' AND column_name = 'notes');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f626f72726f77696e6773602041444420434f4c554d4e20606e6f746573602054455854204e554c4c20414654455220737461747573 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: library_borrowings.issued_by
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_borrowings' AND column_name = 'issued_by');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f626f72726f77696e6773602041444420434f4c554d4e20606973737565645f627960204348415228333629204e554c4c204146544552206e6f746573 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: library_borrowings.returned_to
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_borrowings' AND column_name = 'returned_to');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f626f72726f77696e6773602041444420434f4c554d4e206072657475726e65645f746f60204348415228333629204e554c4c204146544552206973737565645f6279 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: library_borrowings.created_at
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_borrowings' AND column_name = 'created_at');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f626f72726f77696e6773602041444420434f4c554d4e2060637265617465645f617460204441544554494d45204e4f54204e554c4c2044454641554c542043555252454e545f54494d455354414d50 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: library_borrowings.updated_at
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_borrowings' AND column_name = 'updated_at');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f626f72726f77696e6773602041444420434f4c554d4e2060757064617465645f617460204441544554494d45204e554c4c USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- 5. ENHANCE LIBRARY RESERVATIONS / REQUESTS
-- Idempotent MySQL column addition: library_reservations.needed_date
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_reservations' AND column_name = 'needed_date');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f7265736572766174696f6e73602041444420434f4c554d4e20606e65656465645f64617465602044415445204e554c4c20414654455220737461747573 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: library_reservations.return_period_days
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_reservations' AND column_name = 'return_period_days');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f7265736572766174696f6e73602041444420434f4c554d4e206072657475726e5f706572696f645f646179736020534d414c4c494e54204e4f54204e554c4c2044454641554c54203134204146544552206e65656465645f64617465 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: library_reservations.notes
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_reservations' AND column_name = 'notes');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f7265736572766174696f6e73602041444420434f4c554d4e20606e6f746573602054455854204e554c4c2041465445522072657475726e5f706572696f645f64617973 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: library_reservations.approved_by
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_reservations' AND column_name = 'approved_by');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f7265736572766174696f6e73602041444420434f4c554d4e2060617070726f7665645f627960204348415228333629204e554c4c204146544552206e6f746573 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: library_reservations.approved_at
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_reservations' AND column_name = 'approved_at');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f7265736572766174696f6e73602041444420434f4c554d4e2060617070726f7665645f617460204441544554494d45204e554c4c20414654455220617070726f7665645f6279 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: library_reservations.rejected_reason
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_reservations' AND column_name = 'rejected_reason');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f7265736572766174696f6e73602041444420434f4c554d4e206072656a65637465645f726561736f6e6020564152434841522832353529204e554c4c20414654455220617070726f7665645f6174 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: library_reservations.updated_at
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_reservations' AND column_name = 'updated_at');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f7265736572766174696f6e73602041444420434f4c554d4e2060757064617465645f617460204441544554494d45204e554c4c USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Modify reservation status enum if needed to support full workflow
ALTER TABLE library_reservations
  MODIFY COLUMN status ENUM('pending','approved','ready_for_collection','fulfilled','rejected','cancelled') NOT NULL DEFAULT 'pending';

-- 6. PERSISTENT LANDING MEDIA TABLES (Authoritative MySQL Storage)
CREATE TABLE IF NOT EXISTS landing_media_config (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  rotate_interval_ms INT NOT NULL DEFAULT 4000,
  background_src VARCHAR(500) NOT NULL DEFAULT '/tum-gate-monument.jpg',
  background_opacity DECIMAL(3,2) NOT NULL DEFAULT 0.80,
  background_blur_px SMALLINT NOT NULL DEFAULT 1,
  background_title VARCHAR(200) NOT NULL DEFAULT 'TUM Main Entrance Gate Monument',
  last_updated_by VARCHAR(150) NOT NULL DEFAULT 'System Administrator',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS landing_media_slides (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  src VARCHAR(500) NOT NULL,
  caption VARCHAR(255) NOT NULL,
  eyebrow VARCHAR(150) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order SMALLINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS landing_media_gallery (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  src VARCHAR(500) NOT NULL,
  alt VARCHAR(255) NOT NULL DEFAULT 'TUMCU Community',
  caption VARCHAR(255) NULL,
  span VARCHAR(50) NOT NULL DEFAULT 'standard',
  display_order SMALLINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. MEMBER GALLERY ALBUMS (Google Photos & Curated CU Photos)
CREATE TABLE IF NOT EXISTS gallery_albums (
  id CHAR(36) NOT NULL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  category ENUM('sunday_services','worship_services','prayer_meetings','conferences','retreats','evangelism','missions','fellowships','special_events','other') NOT NULL DEFAULT 'special_events',
  event_type VARCHAR(100) NULL,
  event_date DATE NOT NULL,
  description TEXT NULL,
  cover_image_url VARCHAR(500) NOT NULL,
  google_photos_url VARCHAR(1000) NULL,
  photo_count INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  display_order SMALLINT NOT NULL DEFAULT 1,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_gallery_published (is_published, event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. ENHANCE EVANGELISM TEAMS FOR NORET & SORET
-- Idempotent MySQL column addition: evangelism_teams.short_name
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'evangelism_teams' AND column_name = 'short_name');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576616e67656c69736d5f7465616d73602041444420434f4c554d4e206073686f72745f6e616d6560205641524348415228353029204e554c4c204146544552206e616d65 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: evangelism_teams.region
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'evangelism_teams' AND column_name = 'region');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576616e67656c69736d5f7465616d73602041444420434f4c554d4e2060726567696f6e6020564152434841522831303029204e554c4c2041465445522073686f72745f6e616d65 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: evangelism_teams.description
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'evangelism_teams' AND column_name = 'description');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576616e67656c69736d5f7465616d73602041444420434f4c554d4e20606465736372697074696f6e602054455854204e554c4c20414654455220726567696f6e USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: evangelism_teams.mission_purpose
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'evangelism_teams' AND column_name = 'mission_purpose');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576616e67656c69736d5f7465616d73602041444420434f4c554d4e20606d697373696f6e5f707572706f7365602054455854204e554c4c204146544552206465736372697074696f6e USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: evangelism_teams.vision
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'evangelism_teams' AND column_name = 'vision');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576616e67656c69736d5f7465616d73602041444420434f4c554d4e2060766973696f6e602054455854204e554c4c204146544552206d697373696f6e5f707572706f7365 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: evangelism_teams.scripture_theme
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'evangelism_teams' AND column_name = 'scripture_theme');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576616e67656c69736d5f7465616d73602041444420434f4c554d4e20607363726970747572655f7468656d656020564152434841522832353529204e554c4c20414654455220766973696f6e USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: evangelism_teams.cover_image_url
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'evangelism_teams' AND column_name = 'cover_image_url');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576616e67656c69736d5f7465616d73602041444420434f4c554d4e2060636f7665725f696d6167655f75726c6020564152434841522835303029204e554c4c204146544552207363726970747572655f7468656d65 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: evangelism_teams.logo_url
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'evangelism_teams' AND column_name = 'logo_url');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576616e67656c69736d5f7465616d73602041444420434f4c554d4e20606c6f676f5f75726c6020564152434841522835303029204e554c4c20414654455220636f7665725f696d6167655f75726c USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: evangelism_teams.meeting_schedule
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'evangelism_teams' AND column_name = 'meeting_schedule');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576616e67656c69736d5f7465616d73602041444420434f4c554d4e20606d656574696e675f7363686564756c656020564152434841522832303029204e554c4c204146544552206c6f676f5f75726c USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: evangelism_teams.meeting_venue
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'evangelism_teams' AND column_name = 'meeting_venue');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576616e67656c69736d5f7465616d73602041444420434f4c554d4e20606d656574696e675f76656e75656020564152434841522832303029204e554c4c204146544552206d656574696e675f7363686564756c65 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: evangelism_teams.is_active
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'evangelism_teams' AND column_name = 'is_active');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576616e67656c69736d5f7465616d73602041444420434f4c554d4e206069735f6163746976656020424f4f4c45414e204e4f54204e554c4c2044454641554c542054525545204146544552206d656574696e675f76656e7565 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: evangelism_teams.updated_at
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'evangelism_teams' AND column_name = 'updated_at');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606576616e67656c69736d5f7465616d73602041444420434f4c554d4e2060757064617465645f617460204441544554494d45204e554c4c USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- 9. E-TEAM PROGRAMMES & ACTIVITIES
CREATE TABLE IF NOT EXISTS eteam_programmes (
  id CHAR(36) NOT NULL PRIMARY KEY,
  team_id CHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  activity_type ENUM('fellowship','prayer','evangelism','mission','discipleship','bible_study','training','bonding','outreach','followup','special') NOT NULL DEFAULT 'fellowship',
  scheduled_date DATE NOT NULL,
  time_slot VARCHAR(100) NOT NULL DEFAULT '5:00 PM - 7:00 PM',
  venue VARCHAR(200) NOT NULL,
  description TEXT NULL,
  leader_name VARCHAR(150) NULL,
  status ENUM('scheduled','completed','cancelled','postponed') NOT NULL DEFAULT 'scheduled',
  cover_image_url VARCHAR(500) NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ep_team FOREIGN KEY (team_id) REFERENCES evangelism_teams(id) ON DELETE CASCADE,
  INDEX idx_ep_team_date (team_id, scheduled_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. E-TEAM EVENT PHOTOS & ALBUMS
CREATE TABLE IF NOT EXISTS eteam_gallery (
  id CHAR(36) NOT NULL PRIMARY KEY,
  team_id CHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  event_date DATE NOT NULL,
  caption TEXT NULL,
  image_url VARCHAR(500) NOT NULL,
  google_photos_url VARCHAR(1000) NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_eg_team FOREIGN KEY (team_id) REFERENCES evangelism_teams(id) ON DELETE CASCADE,
  INDEX idx_eg_team_date (team_id, event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. E-TEAM OUTREACH & MISSION REPORTS
CREATE TABLE IF NOT EXISTS eteam_reports (
  id CHAR(36) NOT NULL PRIMARY KEY,
  team_id CHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  activity_date DATE NOT NULL,
  location VARCHAR(200) NOT NULL,
  participants_count INT NOT NULL DEFAULT 0,
  souls_reached INT NOT NULL DEFAULT 0,
  outreach_type VARCHAR(100) NOT NULL,
  summary TEXT NOT NULL,
  outcomes TEXT NULL,
  follow_up_notes TEXT NULL,
  submitted_by CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_erpt_team FOREIGN KEY (team_id) REFERENCES evangelism_teams(id) ON DELETE CASCADE,
  INDEX idx_erpt_team (team_id, activity_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. E-TEAM ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS eteam_announcements (
  id CHAR(36) NOT NULL PRIMARY KEY,
  team_id CHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  priority ENUM('normal','high','urgent') NOT NULL DEFAULT 'normal',
  published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  created_by CHAR(36) NOT NULL,
  CONSTRAINT fk_eann_team FOREIGN KEY (team_id) REFERENCES evangelism_teams(id) ON DELETE CASCADE,
  INDEX idx_eann_team (team_id, published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
