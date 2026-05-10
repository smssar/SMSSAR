import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  await prisma.city.createMany({
    data: [
      { name: "Dubai", name_en: "Dubai", slug: "dubai" },
      { name: "Abu Dhabi", name_en: "Abu Dhabi", slug: "abu-dhabi" },
      { name: "Sharjah", name_en: "Sharjah", slug: "sharjah" },
      { name: "Ajman", name_en: "Ajman", slug: "ajman" },
      {
        name: "Ras Al Khaimah",
        name_en: "Ras Al Khaimah",
        slug: "ras-al-khaimah",
      },
      { name: "Al Ain", name_en: "Al Ain", slug: "al-ain" },
      {
        name: "Umm Al Quwain",
        name_en: "Umm Al Quwain",
        slug: "umm-al-quwain",
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
