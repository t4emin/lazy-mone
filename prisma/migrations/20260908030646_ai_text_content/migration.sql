-- CreateTable
CREATE TABLE "ContentDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "targetPlatform" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "additionalInstructions" TEXT NOT NULL,
    "hook" TEXT NOT NULL,
    "script" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "hashtags" TEXT[],
    "aiProvider" TEXT NOT NULL,
    "aiModel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentDraft_userId_createdAt_idx" ON "ContentDraft"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ContentDraft_productId_idx" ON "ContentDraft"("productId");

-- AddForeignKey
ALTER TABLE "ContentDraft" ADD CONSTRAINT "ContentDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDraft" ADD CONSTRAINT "ContentDraft_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
