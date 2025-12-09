-- Add image_url column to quiz_questions table
-- This allows quiz questions to have optional images

ALTER TABLE quiz_questions 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Optional: Add a comment to document the column
COMMENT ON COLUMN quiz_questions.image_url IS 'Optional URL to an image associated with the quiz question. Images are stored in Supabase storage bucket "training-media" under the "quiz-questions" folder.';

