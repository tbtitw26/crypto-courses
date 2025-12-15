-- AlterTable
ALTER TABLE "CustomCourseRequest" ADD COLUMN IF NOT EXISTS "assets_status" TEXT,
ADD COLUMN IF NOT EXISTS "assets_error" TEXT,
ADD COLUMN IF NOT EXISTS "cover_path" TEXT,
ADD COLUMN IF NOT EXISTS "diagram_paths" JSONB;

-- AlterTable
ALTER TABLE "AiStrategyRun" ADD COLUMN IF NOT EXISTS "assets_status" TEXT,
ADD COLUMN IF NOT EXISTS "assets_error" TEXT,
ADD COLUMN IF NOT EXISTS "cover_path" TEXT,
ADD COLUMN IF NOT EXISTS "diagram_paths" JSONB;

