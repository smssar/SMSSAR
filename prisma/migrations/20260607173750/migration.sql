/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `Purchase` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `Purchase` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_purchaseProductId_fkey";

-- AlterTable
ALTER TABLE "Purchase" DROP COLUMN "expiresAt",
DROP COLUMN "metadata",
ALTER COLUMN "quantity" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PurchaseProduct" ADD COLUMN     "description_ar" TEXT,
ADD COLUMN     "description_fr" TEXT;

-- CreateIndex
CREATE INDEX "Purchase_paymentId_idx" ON "Purchase"("paymentId");

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_purchaseProductId_fkey" FOREIGN KEY ("purchaseProductId") REFERENCES "PurchaseProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
