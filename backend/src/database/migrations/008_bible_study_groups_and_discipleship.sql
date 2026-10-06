-- ============================================================================
-- 008_bible_study_groups_and_discipleship.sql
-- Intelligent Bible Study Group Creation, Gender-Balanced Distribution & Discipleship Management
-- ============================================================================

CREATE TABLE IF NOT EXISTS bible_study_groups (
    id VARCHAR(50) NOT NULL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    cohort_name VARCHAR(150) NOT NULL DEFAULT '2026/2027 Discipleship Cohort',
    leader_id VARCHAR(50) NULL,
    assistant_leader_id VARCHAR(50) NULL,
    meeting_day VARCHAR(50) NULL DEFAULT 'Wednesday',
    meeting_time VARCHAR(50) NULL DEFAULT '5:00 PM – 6:30 PM',
    location VARCHAR(200) NULL DEFAULT 'Main Chapel / Discussion Grounds',
    study_book_guide VARCHAR(200) NULL DEFAULT 'Foundations of Biblical Discipleship',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bible_study_members (
    id VARCHAR(50) NOT NULL PRIMARY KEY,
    group_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'member',
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_bsm_group (group_id),
    INDEX idx_bsm_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
