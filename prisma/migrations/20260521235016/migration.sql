-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "localSessionId" TEXT;

-- CreateIndex
CREATE INDEX "Subscription_localSessionId_idx" ON "Subscription"("localSessionId");
