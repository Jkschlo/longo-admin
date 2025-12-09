-- =====================================================
-- Add SOP URL field to modules table
-- =====================================================
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Add sop_url column to modules table
ALTER TABLE modules
ADD COLUMN IF NOT EXISTS sop_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN modules.sop_url IS 'URL to the Standard Operating Procedure (SOP) PDF file for this module';

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'modules'
AND column_name = 'sop_url';

