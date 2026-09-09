ALTER TABLE "PublishJob" ADD COLUMN "scheduledAt" TIMESTAMP(3);
ALTER TABLE "PublishJob" ADD COLUMN "cancelledAt" TIMESTAMP(3);
CREATE INDEX "PublishJob_status_scheduledAt_idx" ON "PublishJob"("status", "scheduledAt");
