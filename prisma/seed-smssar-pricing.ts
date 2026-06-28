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
  // Update plan_free with SMSSAR pricing and limits
  await prisma.plan.update({
    where: { id: "plan_free" },
    data: {
      smmsarPrice: 0,
      smssarListings: null,
      smssarMaxFeaturedListings: 0,
      smssarMaxImagesPerListing: 3,
      smssarMaxVideosPerListing: 0,
    },
  });
  console.log("✅ Updated plan_free with SMSSAR values");

  // Update plan_pro with SMSSAR pricing and limits (20% discount)
  await prisma.plan.update({
    where: { id: "plan_pro" },
    data: {
      smmsarPrice: 79,
      smssarListings: 10,
      smssarMaxFeaturedListings: 3,
      smssarMaxImagesPerListing: 10,
      smssarMaxVideosPerListing: 2,
    },
  });
  console.log("✅ Updated plan_pro with SMSSAR values");

  // Update plan_premium with SMSSAR pricing and limits (20% discount)
  await prisma.plan.update({
    where: { id: "plan_premium" },
    data: {
      smmsarPrice: 239,
      smssarListings: null,
      smssarMaxFeaturedListings: 10,
      smssarMaxImagesPerListing: 30,
      smssarMaxVideosPerListing: 5,
    },
  });
  console.log("✅ Updated plan_premium with SMSSAR values");

  console.log("✅ SMSSAR pricing and limits have been applied to all plans");
}

main()
  .catch((error) => {
    console.error("❌ Script failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
