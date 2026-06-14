/*
  Warnings:

  - You are about to drop the column `heroText` on the `Page` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Page" DROP COLUMN "heroText",
ADD COLUMN     "article_ar" TEXT,
ADD COLUMN     "article_fr" TEXT,
ADD COLUMN     "description_ar" TEXT,
ADD COLUMN     "description_fr" TEXT,
ADD COLUMN     "seoDescription_ar" TEXT,
ADD COLUMN     "seoDescription_fr" TEXT,
ADD COLUMN     "seoTitle_ar" TEXT,
ADD COLUMN     "seoTitle_fr" TEXT,
ADD COLUMN     "subtitle_ar" TEXT,
ADD COLUMN     "subtitle_fr" TEXT,
ADD COLUMN     "title_ar" TEXT,
ADD COLUMN     "title_fr" TEXT;
