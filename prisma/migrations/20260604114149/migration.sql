/*
  Warnings:

  - The `code` column on the `PurchaseProduct` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "PurchaseProduct" DROP COLUMN "code",
ADD COLUMN     "code" "PurchaseType";

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseProduct_code_key" ON "PurchaseProduct"("code");
