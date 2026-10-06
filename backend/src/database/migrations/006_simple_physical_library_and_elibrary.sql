-- ============================================================================
-- TECUMP / TUMCU Migration 006: Simple Physical Lending Register & E-Library
-- Aligns library with actual Christian Union operations:
-- 1. Digital E-Library catalogue (downloadable materials only)
-- 2. Physical Book Lending Register (title, borrower info, dates, status)
-- 3. Removes dependency on physical book inventory / stock counts
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Make resource_id nullable in library_borrowings so physical loans do not require an inventory record
ALTER TABLE library_borrowings
  MODIFY COLUMN resource_id CHAR(36) NULL;

-- 2. Add direct book title and borrower snapshot fields to library_borrowings
-- Idempotent MySQL column addition: library_borrowings.book_title
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_borrowings' AND column_name = 'book_title');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f626f72726f77696e6773602041444420434f4c554d4e2060626f6f6b5f7469746c656020564152434841522832353029204e554c4c204146544552206964 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: library_borrowings.borrower_name
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_borrowings' AND column_name = 'borrower_name');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f626f72726f77696e6773602041444420434f4c554d4e2060626f72726f7765725f6e616d656020564152434841522831353029204e554c4c20414654455220757365725f6964 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: library_borrowings.borrower_email
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_borrowings' AND column_name = 'borrower_email');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f626f72726f77696e6773602041444420434f4c554d4e2060626f72726f7765725f656d61696c6020564152434841522831353029204e554c4c20414654455220626f72726f7765725f6e616d65 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: library_borrowings.borrower_phone
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_borrowings' AND column_name = 'borrower_phone');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f626f72726f77696e6773602041444420434f4c554d4e2060626f72726f7765725f70686f6e6560205641524348415228353029204e554c4c20414654455220626f72726f7765725f656d61696c USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- Idempotent MySQL column addition: library_borrowings.due_at
SET @tecump_col_exists := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'library_borrowings' AND column_name = 'due_at');
SET @tecump_sql := IF(@tecump_col_exists = 0, CONVERT(0x414c544552205441424c4520606c6962726172795f626f72726f77696e6773602041444420434f4c554d4e20606475655f617460204441544554494d45204e554c4c20414654455220626f72726f7765645f6174 USING utf8mb4), CONVERT(0x53454c4543542031 USING utf8mb4));
PREPARE tecump_stmt FROM @tecump_sql;
EXECUTE tecump_stmt;
DEALLOCATE PREPARE tecump_stmt;

-- 3. Populate existing borrowing rows from library_resources and users if book_title is missing
UPDATE library_borrowings lb
LEFT JOIN library_resources lr ON lr.id = lb.resource_id
LEFT JOIN users u ON u.id = lb.user_id
SET
  lb.book_title = COALESCE(lb.book_title, lr.title, 'General Christian Book'),
  lb.borrower_name = COALESCE(lb.borrower_name, u.full_name, 'Registered Member'),
  lb.borrower_email = COALESCE(lb.borrower_email, u.email, ''),
  lb.borrower_phone = COALESCE(lb.borrower_phone, u.phone_number, ''),
  lb.due_at = COALESCE(lb.due_at, lb.due_date);

-- 4. Ensure is_digital is set to 1 for all digital library resources
UPDATE library_resources
SET is_digital = 1
WHERE file_url IS NOT NULL OR is_digital = 1;

SET FOREIGN_KEY_CHECKS = 1;
