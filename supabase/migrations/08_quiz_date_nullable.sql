-- Allow bonus quiz questions without a date
ALTER TABLE quiz_questions ALTER COLUMN date DROP NOT NULL;
