-- AlterTable
-- This migration adds support for 'in_queue' status in AiStrategyRun
-- No actual schema change needed as status is already a String field
-- This is a documentation-only migration to reflect the schema comment update

-- The status field already supports any string value, so 'in_queue' can be used immediately
-- This migration exists to document the schema change in the migration history

