CREATE TABLE "VideoJob" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "providerJobId" TEXT,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "durationSeconds" INTEGER NOT NULL,
  "aspectRatio" TEXT NOT NULL,
  "referenceAssetId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "estimatedCost" DECIMAL(12,4),
  "errorMessage" TEXT,
  "outputAssetId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VideoJob_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VideoJob_outputAssetId_key" ON "VideoJob"("outputAssetId");
CREATE INDEX "VideoJob_userId_createdAt_idx" ON "VideoJob"("userId", "createdAt");
CREATE INDEX "VideoJob_contentId_createdAt_idx" ON "VideoJob"("contentId", "createdAt");
CREATE INDEX "VideoJob_status_idx" ON "VideoJob"("status");
ALTER TABLE "VideoJob" ADD CONSTRAINT "VideoJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VideoJob" ADD CONSTRAINT "VideoJob_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VideoJob" ADD CONSTRAINT "VideoJob_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
