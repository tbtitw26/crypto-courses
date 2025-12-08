-- AlterTable
ALTER TABLE "AiStrategyRun" ADD COLUMN     "status_error" TEXT,
ADD COLUMN     "status_message" TEXT,
ADD COLUMN     "status_progress" INTEGER,
ADD COLUMN     "status_stage" TEXT;

-- AlterTable
ALTER TABLE "CustomCourseRequest" ADD COLUMN     "status_error" TEXT,
ADD COLUMN     "status_message" TEXT,
ADD COLUMN     "status_progress" INTEGER,
ADD COLUMN     "status_stage" TEXT;
