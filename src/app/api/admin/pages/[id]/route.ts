import { NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
// The file uses `any` in a small, deliberate way for request bodies
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;
  const body = await req.json();

  // prevent changing the primary id via payload
  if (body && typeof body === "object" && "id" in body) {
    delete (body as any).id;
  }

  // Sanitize input similar to POST
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

  data.prioritiesCityIds = Array.isArray(data.prioritiesCityIds)
    ? data.prioritiesCityIds
    : [];
  data.propertiesNeighborhoods = Array.isArray(data.propertiesNeighborhoods)
    ? data.propertiesNeighborhoods
    : [];
  data.prioritiesPropertyTypeIds = Array.isArray(data.prioritiesPropertyTypeIds)
    ? data.prioritiesPropertyTypeIds
    : [];

  // If slug is being updated to empty, regenerate it from title
  if (
    data.slug !== undefined &&
    (!data.slug || String(data.slug).trim() === "")
  ) {
    const { slugify } = await import("@/lib/format");
    data.slug = slugify(String(data.title || "page")) + "-" + Date.now();
  }

  try {
    const updated = await prisma.page.update({
      where: { id: resolvedParams.id },
      data,
    });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e?.code === "P2002") {
      return NextResponse.json(
        { error: "Conflict: unique constraint" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: e?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;
  try {
    await prisma.page.delete({ where: { id: resolvedParams.id } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: e?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
