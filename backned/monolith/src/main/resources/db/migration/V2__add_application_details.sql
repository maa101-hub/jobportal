-- Candidate application form fields. Run before deploying with DDL_AUTO=validate.
ALTER TABLE applications ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS phone VARCHAR(100);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS experience VARCHAR(255);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS education VARCHAR(255);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS cover_letter VARCHAR(2000);
