-- AlterTable
ALTER TABLE "CustomCourseRequest" ADD COLUMN IF NOT EXISTS "email_status" TEXT,
ADD COLUMN IF NOT EXISTS "email_sent_at" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "email_error" TEXT,
ADD COLUMN IF NOT EXISTS "email_message_id" TEXT;

-- AlterTable
ALTER TABLE "AiStrategyRun" ADD COLUMN IF NOT EXISTS "email_status" TEXT,
ADD COLUMN IF NOT EXISTS "email_sent_at" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "email_error" TEXT,
ADD COLUMN IF NOT EXISTS "email_message_id" TEXT;

