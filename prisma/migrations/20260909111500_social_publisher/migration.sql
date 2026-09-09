CREATE TABLE "PublishJob" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "contentId" TEXT NOT NULL,
  "socialAccountId" TEXT NOT NULL, "platform" TEXT NOT NULL, "caption" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending', "externalPostId" TEXT, "errorMessage" TEXT,
  "publishedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "PublishJob_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PublishJob_userId_createdAt_idx" ON "PublishJob"("userId", "createdAt");
CREATE INDEX "PublishJob_contentId_status_idx" ON "PublishJob"("contentId", "status");
ALTER TABLE "PublishJob" ADD CONSTRAINT "PublishJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublishJob" ADD CONSTRAINT "PublishJob_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
