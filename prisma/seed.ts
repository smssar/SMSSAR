import "dotenv/config";

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function main() {
  await prisma.propertyType.createMany({
    data: [
      {
        name: "Apartment",
        name_en: "Apartment",
        name_ar: "شقة",
        name_fr: "Appartement",
        slug: "apartment",
      },
      {
        name: "Villa",
        name_en: "Villa",
        name_ar: "فيلا",
        name_fr: "Villa",
        slug: "villa",
      },
      {
        name: "House",
        name_en: "House",
        name_ar: "منزل",
        name_fr: "Maison",
        slug: "house",
      },
      {
        name: "Studio",
        name_en: "Studio",
        name_ar: "استوديو",
        name_fr: "Studio",
        slug: "studio",
      },
      {
        name: "Duplex",
        name_en: "Duplex",
        name_ar: "دوبلكس",
        name_fr: "Duplex",
        slug: "duplex",
      },
      {
        name: "Penthouse",
        name_en: "Penthouse",
        name_ar: "بنتهاوس",
        name_fr: "Penthouse",
        slug: "penthouse",
      },
      {
        name: "Office",
        name_en: "Office",
        name_ar: "مكتب",
        name_fr: "Bureau",
        slug: "office",
      },
      {
        name: "Shop",
        name_en: "Shop",
        name_ar: "محل تجاري",
        name_fr: "Magasin",
        slug: "shop",
      },
      {
        name: "Commercial Space",
        name_en: "Commercial Space",
        name_ar: "مساحة تجارية",
        name_fr: "Local commercial",
        slug: "commercial-space",
      },
      {
        name: "Warehouse",
        name_en: "Warehouse",
        name_ar: "مستودع",
        name_fr: "Entrepôt",
        slug: "warehouse",
      },

      {
        name: "Building",
        name_en: "Building",
        name_ar: "عمارة",
        name_fr: "Immeuble",
        slug: "building",
      },
      {
        name: "Room",
        name_en: "Room",
        name_ar: "غرفة",
        name_fr: "Chambre",
        slug: "room",
      },
      {
        name: "Shared Accommodation",
        name_en: "Shared Accommodation",
        name_ar: "سكن مشترك",
        name_fr: "Colocation",
        slug: "shared-accommodation",
      },
    ],
    skipDuplicates: true,
  });
  // Cities
  // await prisma.city.createMany({
  //   data: [
  //     { name: "Dubai", name_en: "Dubai", slug: "dubai" },
  //     { name: "Abu Dhabi", name_en: "Abu Dhabi", slug: "abu-dhabi" },
  //     { name: "Sharjah", name_en: "Sharjah", slug: "sharjah" },
  //     { name: "Ajman", name_en: "Ajman", slug: "ajman" },
  //     {
  //       name: "Ras Al Khaimah",
  //       name_en: "Ras Al Khaimah",
  //       slug: "ras-al-khaimah",
  //     },
  //     {
  //       name: "Al Ain",
  //       name_en: "Al Ain",
  //       slug: "al-ain",
  //     },
  //     {
  //       name: "Umm Al Quwain",
  //       name_en: "Umm Al Quwain",
  //       slug: "umm-al-quwain",
  //     },
  //   ],
  //   skipDuplicates: true,
  // });

  // await prisma.purchaseProduct.createMany({
  //   data: [
  //     {
  //       code: "EXTRA_IMAGES",
  //       title: "Extra Images",
  //       title_ar: "صور إضافية",
  //       title_fr: "Images supplémentaires",
  //       description: "Add extra images to a listing",
  //       price: 5,
  //       active: true,
  //     },
  //     {
  //       code: "ADS_DURATION_PER_DAY",
  //       title: "Ads Duration Per Day",
  //       title_ar: "مدة الإعلان اليومية",
  //       title_fr: "Durée quotidienne de l'annonce",
  //       description: "Extend advertisement duration by one day",
  //       price: 5,
  //       active: true,
  //     },
  //     {
  //       code: "EXTRA_VIDEOS",
  //       title: "Extra Videos",
  //       title_ar: "مقاطع فيديو إضافية",
  //       title_fr: "Vidéos supplémentaires",
  //       description: "Add extra videos to a listing",
  //       price: 10,
  //       active: true,
  //     },
  //     {
  //       code: "EXTRA_LISTINGS",
  //       title: "Extra Listings",
  //       title_ar: "عقارات إضافية",
  //       title_fr: "Annonces supplémentaires",
  //       description: "Increase the number of listings allowed",
  //       price: 25,
  //       active: true,
  //     },
  //     {
  //       code: "EXTRA_FEATURED_LISTINGS",
  //       title: "Extra Featured Listings",
  //       title_ar: "عقارات مميزة إضافية",
  //       title_fr: "Annonces mises en avant supplémentaires",
  //       description: "Add more featured listing slots",
  //       price: 20,
  //       active: true,
  //     },
  //   ],
  //   skipDuplicates: true,
  // });

  // await prisma.plan.createMany({
  //   data: [
  //     {
  //       id: "plan_free",
  //       title: "Free",
  //       title_ar: "مجاني",
  //       title_fr: "Gratuit",
  //       description: "Get started with basic listings",
  //       description_ar: "ابدأ بالإعلانات الأساسية",
  //       description_fr: "Commencez avec des annonces de base",
  //       price: 0,
  //       listings: 3,
  //       featured: false,
  //       ads: 0,
  //       adsduration: 0,
  //       maxFeaturedListings: 0,
  //       maxImagesPerListing: 3,
  //       maxVideosPerListing: 0,
  //     },
  //     {
  //       id: "plan_pro",
  //       title: "Pro",
  //       title_ar: "احترافي",
  //       title_fr: "Pro",
  //       description: "Perfect for active sellers",
  //       description_ar: "مثالي للبائعين النشطين",
  //       description_fr: "Parfait pour les vendeurs actifs",
  //       price: 99,
  //       listings: 10,
  //       featured: true,
  //       ads: 5,
  //       adsduration: 10,
  //       maxFeaturedListings: 3,
  //       maxImagesPerListing: 10,
  //       maxVideosPerListing: 2,
  //     },
  //     {
  //       id: "plan_premium",
  //       title: "Premium",
  //       title_ar: "بريميوم",
  //       title_fr: "Premium",
  //       description: "Unlimited power for professionals",
  //       description_ar: "قدرة غير محدودة للمحترفين",
  //       description_fr: "Puissance illimitée pour les professionnels",
  //       price: 299,
  //       listings: null,
  //       featured: true,
  //       ads: 20,
  //       adsduration: 30,
  //       maxFeaturedListings: 10,
  //       maxImagesPerListing: 30,
  //       maxVideosPerListing: 5,
  //     },
  //   ],
  //   skipDuplicates: true,
  // });
  console.log("✅ Seed completed successfully");
}
main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
