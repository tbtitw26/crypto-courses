-- AlterTable: Add run_id and run_type with defaults, then update existing rows
ALTER TABLE "GenerationLog" ADD COLUMN IF NOT EXISTS "run_id" INTEGER DEFAULT 0;
ALTER TABLE "GenerationLog" ADD COLUMN IF NOT EXISTS "run_type" TEXT DEFAULT 'unknown';

-- Update existing rows (set to 0/unknown for old logs)
UPDATE "GenerationLog" SET "run_id" = 0, "run_type" = 'unknown' WHERE "run_id" IS NULL OR "run_type" IS NULL;

-- Make columns required
ALTER TABLE "GenerationLog" ALTER COLUMN "run_id" SET NOT NULL;
ALTER TABLE "GenerationLog" ALTER COLUMN "run_type" SET NOT NULL;
ALTER TABLE "GenerationLog" ALTER COLUMN "run_id" DROP DEFAULT;
ALTER TABLE "GenerationLog" ALTER COLUMN "run_type" DROP DEFAULT;

-- Add indexes
CREATE INDEX IF NOT EXISTS "GenerationLog_run_id_idx" ON "GenerationLog"("run_id");
CREATE INDEX IF NOT EXISTS "GenerationLog_run_type_idx" ON "GenerationLog"("run_type");
