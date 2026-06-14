import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const properties = await prisma.property.findMany({
    select: {
      id: true,
      updatedAt: true,
    },
  });

  const pages = await prisma.page.findMany({
    where: {
      published: true,
    },
    select: {
      slug: true,
      updatedAt: true,
    },
  });

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      priority: 1,
    },

    ...pages.map((page) => ({
      url: `${baseUrl}/page/${page.slug}`,
      lastModified: page.updatedAt,
      priority: 0.9,
    })),

    ...properties.map((property) => ({
      url: `${baseUrl}/property/${property.id}`,
      lastModified: property.updatedAt,
      priority: 0.8,
    })),
  ];
}
