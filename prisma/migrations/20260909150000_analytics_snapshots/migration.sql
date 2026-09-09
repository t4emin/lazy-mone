CREATE TABLE "AnalyticsSnapshot" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "productId" TEXT NOT NULL, "contentId" TEXT NOT NULL,
  "platform" TEXT NOT NULL, "collectedOn" TIMESTAMP(3) NOT NULL,
  "views" INTEGER NOT NULL DEFAULT 0, "likes" INTEGER NOT NULL DEFAULT 0, "comments" INTEGER NOT NULL DEFAULT 0,
  "shares" INTEGER NOT NULL DEFAULT 0, "clicks" INTEGER NOT NULL DEFAULT 0, "orders" INTEGER NOT NULL DEFAULT 0,
  "commission" DECIMAL(12,2) NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "AnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AnalyticsSnapshot_contentId_platform_collectedOn_key" ON "AnalyticsSnapshot"("contentId", "platform", "collectedOn");
CREATE INDEX "AnalyticsSnapshot_userId_collectedOn_idx" ON "AnalyticsSnapshot"("userId", "collectedOn");
CREATE INDEX "AnalyticsSnapshot_productId_platform_idx" ON "AnalyticsSnapshot"("productId", "platform");
ALTER TABLE "AnalyticsSnapshot" ADD CONSTRAINT "AnalyticsSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalyticsSnapshot" ADD CONSTRAINT "AnalyticsSnapshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalyticsSnapshot" ADD CONSTRAINT "AnalyticsSnapshot_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
