-- CreateEnum
CREATE TYPE "AdStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'RUNNING', 'PAUSED', 'ENDED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "ads" INTEGER DEFAULT 0,
ADD COLUMN     "adsduration" INTEGER,
ADD COLUMN     "maxFeaturedListings" INTEGER,
ADD COLUMN     "maxImagesPerListing" INTEGER,
ADD COLUMN     "maxVideosPerListing" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "featuredproperties" INTEGER;

-- CreateTable
CREATE TABLE "Ad" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "planId" TEXT,
    "propertyId" TEXT,
    "status" "AdStatus" NOT NULL DEFAULT 'DRAFT',
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "budget" INTEGER,
    "spentAmount" INTEGER NOT NULL DEFAULT 0,
    "pricePerDay" INTEGER,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "featuredUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Ad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ad_slug_key" ON "Ad"("slug");

-- CreateIndex
CREATE INDEX "Ad_userId_idx" ON "Ad"("userId");

-- CreateIndex
CREATE INDEX "Ad_planId_idx" ON "Ad"("planId");

-- CreateIndex
CREATE INDEX "Ad_propertyId_idx" ON "Ad"("propertyId");

-- CreateIndex
CREATE INDEX "Ad_status_idx" ON "Ad"("status");

-- CreateIndex
CREATE INDEX "Ad_startAt_idx" ON "Ad"("startAt");

-- CreateIndex
CREATE INDEX "Ad_endAt_idx" ON "Ad"("endAt");

-- CreateIndex
CREATE INDEX "Ad_featured_idx" ON "Ad"("featured");

-- CreateIndex
CREATE INDEX "Ad_featuredUntil_idx" ON "Ad"("featuredUntil");

-- CreateIndex
CREATE INDEX "Ad_createdAt_idx" ON "Ad"("createdAt");

-- CreateIndex
CREATE INDEX "Ad_clicks_idx" ON "Ad"("clicks");

-- CreateIndex
CREATE INDEX "Ad_impressions_idx" ON "Ad"("impressions");

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
