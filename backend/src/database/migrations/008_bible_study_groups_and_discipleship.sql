-- TECUMP Migration 008: Bible study group enhancements / compatibility repair
-- Migration 001 owns the canonical Bible-study tables and foreign keys.
-- This migration only adds portal fields that are absent from that core schema.
SET NAMES utf8mb4;
-- Idempotent MySQL column addition: bible_study_groups.cohort_name
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'bible_study_groups' AND column_name = 'cohort_name');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606269626c655f73747564795f67726f757073602041444420434f4c554d4e2060636f686f72745f6e616d656020564152434841522831353029204e4f54204e554c4c2044454641554c542027323032362f32303237204469736369706c657368697020436f686f727427 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: bible_study_groups.assistant_leader_id
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'bible_study_groups' AND column_name = 'assistant_leader_id');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606269626c655f73747564795f67726f757073602041444420434f4c554d4e2060617373697374616e745f6c65616465725f696460204348415228333629204e554c4c USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: bible_study_groups.study_book_guide
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'bible_study_groups' AND column_name = 'study_book_guide');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606269626c655f73747564795f67726f757073602041444420434f4c554d4e206073747564795f626f6f6b5f67756964656020564152434841522832303029204e554c4c2044454641554c542027466f756e646174696f6e73206f66204269626c6963616c204469736369706c657368697027 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: bible_study_groups.is_active
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'bible_study_groups' AND column_name = 'is_active');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606269626c655f73747564795f67726f757073602041444420434f4c554d4e206069735f6163746976656020424f4f4c45414e204e4f54204e554c4c2044454641554c542054525545 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: bible_study_groups.created_at
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'bible_study_groups' AND column_name = 'created_at');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606269626c655f73747564795f67726f757073602041444420434f4c554d4e2060637265617465645f617460204441544554494d45204e4f54204e554c4c2044454641554c542043555252454e545f54494d455354414d50 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: bible_study_groups.updated_at
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'bible_study_groups' AND column_name = 'updated_at');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606269626c655f73747564795f67726f757073602041444420434f4c554d4e2060757064617465645f617460204441544554494d45204e554c4c204f4e205550444154452043555252454e545f54494d455354414d50 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: bible_study_members.role
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'bible_study_members' AND column_name = 'role');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606269626c655f73747564795f6d656d62657273602041444420434f4c554d4e2060726f6c6560205641524348415228333029204e4f54204e554c4c2044454641554c5420276d656d62657227 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: bible_study_members.created_at
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'bible_study_members' AND column_name = 'created_at');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606269626c655f73747564795f6d656d62657273602041444420434f4c554d4e2060637265617465645f617460204441544554494d45204e4f54204e554c4c2044454641554c542043555252454e545f54494d455354414d50 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

