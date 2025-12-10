-- CreateTable
CREATE TABLE "GenerationLog" (
    "id" SERIAL PRIMARY KEY,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX "GenerationLog_created_at_idx" ON "GenerationLog"("created_at");
CREATE INDEX "GenerationLog_level_idx" ON "GenerationLog"("level");

