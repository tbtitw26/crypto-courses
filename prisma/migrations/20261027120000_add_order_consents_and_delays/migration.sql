-- CreateTable
CREATE TABLE IF NOT EXISTS "OrderConsent" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "order_type" TEXT NOT NULL,
    "order_ref" TEXT NOT NULL,
    "terms_accepted" BOOLEAN NOT NULL,
    "immediate_supply" BOOLEAN NOT NULL,
    "withdrawal_loss_ack" BOOLEAN NOT NULL,
    "consent_version" TEXT NOT NULL,
    "consent_text" TEXT NOT NULL,
    "locale" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderConsent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OrderConsent_user_id_idx" ON "OrderConsent"("user_id");
CREATE INDEX IF NOT EXISTS "OrderConsent_order_type_order_ref_idx" ON "OrderConsent"("order_type", "order_ref");

-- AddForeignKey
ALTER TABLE "OrderConsent" ADD CONSTRAINT "OrderConsent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "CustomCourseRequest" ADD COLUMN IF NOT EXISTS "proposed_ready_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "delay_notified_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "request_payload" JSONB,
ADD COLUMN IF NOT EXISTS "cancelled_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "refunded_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "refunded_tokens" INTEGER;

-- AlterTable
ALTER TABLE "AiStrategyRun" ADD COLUMN IF NOT EXISTS "proposed_ready_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "delay_notified_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "request_payload" JSONB,
ADD COLUMN IF NOT EXISTS "cancelled_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "refunded_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "refunded_tokens" INTEGER;

-- Existing failed orders: generation failures become "delayed" so the customer can reschedule or get a refund;
-- orders whose Usage Units were never deducted become "cancelled".
UPDATE "CustomCourseRequest" SET "status" = 'cancelled', "cancelled_at" = NOW()
WHERE "status" = 'failed' AND "status_error" LIKE 'Token deduction failed%';
UPDATE "CustomCourseRequest" SET "status" = 'delayed', "status_stage" = 'delayed'
WHERE "status" = 'failed';

UPDATE "AiStrategyRun" SET "status" = 'cancelled', "cancelled_at" = NOW()
WHERE "status" = 'failed' AND "status_error" LIKE 'Token deduction failed%';
UPDATE "AiStrategyRun" SET "status" = 'delayed', "status_stage" = 'delayed'
WHERE "status" = 'failed';
