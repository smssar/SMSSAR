/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/format";

export async function POST(req: Request) {
  const body = await req.json();
  if (body && typeof body === "object" && "id" in body) {
    // remove provided id to avoid unique constraint conflicts on create
    // cast to any to allow deleting a property on the parsed JSON
    delete (body as any).id;
  }

  // Sanitize and pick allowed fields to avoid passing unexpected shapes to Prisma
  const allowed = new Set([
    "slug",
    "title",
    "title_ar",
    "title_fr",
    "subtitle",
    "subtitle_ar",
    "subtitle_fr",
    "description",
    "description_ar",
    "description_fr",
    "article",
    "article_ar",
    "article_fr",
    "seoTitle",
    "seoTitle_ar",
    "seoTitle_fr",
    "seoDescription",
    "seoDescription_ar",
    "seoDescription_fr",
    "seoKeywords",
    "ogImage",
    "published",
    "noIndex",
    "prioritiesCityIds",
    "propertiesNeighborhoods",
    "prioritiesPropertyTypeIds",
    "prioritiesForSale",
    "prioritiesFeatured",
    "prioritiesMinPrice",
    "prioritiesMaxPrice",
    "prioritiesMinArea",
    "prioritiesMaxArea",
    "prioritiesMinRooms",
    "prioritiesMaxRooms",
    "prioritiesMinBathrooms",
    "prioritiesMaxBathrooms",
    "prioritiesPriceType",
  ]);

  const data: Record<string, any> = {};
  if (body && typeof body === "object") {
    for (const k of Object.keys(body)) {
      if (allowed.has(k)) data[k] = (body as any)[k];
    }
  }

  // Ensure array fields are arrays
  data.prioritiesCityIds = Array.isArray(data.prioritiesCityIds)
    ? data.prioritiesCityIds
    : [];
  data.propertiesNeighborhoods = Array.isArray(data.propertiesNeighborhoods)
    ? data.propertiesNeighborhoods
    : [];
  data.prioritiesPropertyTypeIds = Array.isArray(data.prioritiesPropertyTypeIds)
    ? data.prioritiesPropertyTypeIds
    : [];

  // Ensure slug is set and unique-ish
  if (!data.slug || String(data.slug).trim() === "") {
    data.slug = slugify(String(data.title || "page")) + "-" + Date.now();
  }

  try {
    const created = await prisma.page.create({ data: data as any });
    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    // Return error message to help debug — safe for development
    const e = err as { code?: string; message?: string };
    if (e?.code === "P2002") {
      return NextResponse.json(
        {
          error:
            "Resource conflict: a Page with the same unique field already exists.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: e?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const pages = await prisma.page.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(pages);
}
