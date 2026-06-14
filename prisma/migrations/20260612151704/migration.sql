-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "heroText" TEXT,
    "description" TEXT,
    "article" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "ogImage" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "prioritiesCityIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "propertiesNeighborhoods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "prioritiesPropertyTypeIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "prioritiesForSale" BOOLEAN DEFAULT false,
    "prioritiesFeatured" BOOLEAN DEFAULT false,
    "prioritiesMinPrice" INTEGER,
    "prioritiesMaxPrice" INTEGER,
    "prioritiesMinArea" INTEGER,
    "prioritiesMaxArea" INTEGER,
    "prioritiesMinRooms" INTEGER,
    "prioritiesMaxRooms" INTEGER,
    "prioritiesMinBathrooms" INTEGER,
    "prioritiesMaxBathrooms" INTEGER,
    "prioritiesPriceType" TEXT DEFAULT 'MONTHLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");
