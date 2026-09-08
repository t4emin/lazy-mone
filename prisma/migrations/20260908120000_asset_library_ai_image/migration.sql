ALTER TABLE "ProductAsset" ADD COLUMN "contentId" TEXT,
ADD COLUMN "prompt" TEXT,
ADD COLUMN "aspectRatio" TEXT,
ADD COLUMN "aiProvider" TEXT,
ADD COLUMN "aiModel" TEXT;

CREATE INDEX "ProductAsset_contentId_idx" ON "ProductAsset"("contentId");
ALTER TABLE "ProductAsset" ADD CONSTRAINT "ProductAsset_contentId_fkey"
FOREIGN KEY ("contentId") REFERENCES "ContentDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;
