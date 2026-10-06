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
ALTER TABLE library_borrowings
  ADD COLUMN IF NOT EXISTS book_title VARCHAR(250) NULL AFTER id,
  ADD COLUMN IF NOT EXISTS borrower_name VARCHAR(150) NULL AFTER user_id,
  ADD COLUMN IF NOT EXISTS borrower_email VARCHAR(150) NULL AFTER borrower_name,
  ADD COLUMN IF NOT EXISTS borrower_phone VARCHAR(50) NULL AFTER borrower_email,
  ADD COLUMN IF NOT EXISTS due_at DATETIME NULL AFTER borrowed_at;

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
