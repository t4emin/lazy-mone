CREATE TABLE "SocialAccount" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "platform" TEXT NOT NULL,
  "accountName" TEXT NOT NULL, "externalAccountId" TEXT NOT NULL,
  "tokenCiphertext" TEXT NOT NULL, "refreshTokenCiphertext" TEXT,
  "expiresAt" TIMESTAMP(3), "status" TEXT NOT NULL DEFAULT 'connected',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SocialAccount_userId_platform_externalAccountId_key" ON "SocialAccount"("userId", "platform", "externalAccountId");
CREATE INDEX "SocialAccount_userId_platform_idx" ON "SocialAccount"("userId", "platform");
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
