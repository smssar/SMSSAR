import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { properties as fallbackProperties } from "@/lib/site-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  let properties: { id: string; updatedAt: Date }[] = [];
  let pages: { slug: string; updatedAt: Date }[] = [];

  try {
    properties = await prisma.property.findMany({
      where: { isAvailable: true },
      select: {
        id: true,
        updatedAt: true,
      },
    });
  } catch (err) {
    // Prisma may time out during prerender; fall back to local mock data
    // and allow the build to continue.
    // eslint-disable-next-line no-console
    console.error(
      "sitemap: failed to load properties from DB, using fallback",
      err,
    );
    properties = fallbackProperties.map((p) => ({
      id: p.id,
      updatedAt: new Date(),
    }));
  }

  try {
    pages = await prisma.page.findMany({
      where: {
        published: true,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    });
  } catch (err) {
    // If pages can't be loaded, use an empty list so sitemap still builds.
    // eslint-disable-next-line no-console
    console.error("sitemap: failed to load pages from DB, skipping pages", err);
    pages = [];
  }

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
