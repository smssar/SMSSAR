import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, readJson, toSlug } from "@/lib/api-utils";

export const runtime = "nodejs";

export async function GET() {
  try {
    const propertyTypes = await prisma.propertyType.findMany({
      include: { _count: { select: { properties: true } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: propertyTypes }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch property types:", error);
    return NextResponse.json(
      { error: "Failed to fetch property types" },
      { status: 500 },
    );
  }
}

type PostPropertyTypeBody = {
  name_en?: string;
  name_ar?: string;
  name_fr?: string;
  slug?: string;
};

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return jsonError("Authentication required.", 401);
  }

  if (session.user.role !== "ADMIN") {
    return jsonError("Only admins can create property types.", 403);
  }

  const body = await readJson<PostPropertyTypeBody>(request);
  if (!body) {
    return jsonError("Invalid JSON body.");
  }

  const nameEn = body.name_en?.trim();
  const nameAr = body.name_ar?.trim() || null;
  const nameFr = body.name_fr?.trim() || null;

  if (!nameEn) {
    return jsonError("Field 'name_en' is required.");
  }

  const slug = body.slug?.trim() || toSlug(nameEn);
  if (!slug) {
    return jsonError("Field 'slug' is invalid.");
  }

  const slugConflict = await prisma.propertyType.findFirst({
    where: { slug },
    select: { id: true },
  });
  if (slugConflict) {
    return jsonError("Property type slug already exists.", 409);
  }

  const nameConflict = await prisma.propertyType.findFirst({
    where: { name: nameEn },
    select: { id: true },
  });
  if (nameConflict) {
    return jsonError("Property type name already exists.", 409);
  }

  try {
    const propertyType = await prisma.propertyType.create({
      data: {
        name: nameEn,
        name_en: nameEn,
        name_ar: nameAr,
        name_fr: nameFr,
        slug,
      },
    });

    return NextResponse.json({ data: propertyType }, { status: 201 });
  } catch (error: unknown) {
    const prismaCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
        ? ((error as { code: string }).code as string)
        : null;

    if (prismaCode === "P2002") {
      const target =
        typeof error === "object" &&
        error !== null &&
        "meta" in error &&
        error.meta &&
        typeof error.meta === "object" &&
        "target" in error.meta
          ? (error.meta as { target?: unknown }).target
          : null;

      const targetText = Array.isArray(target)
        ? target.join(", ")
        : typeof target === "string"
          ? target
          : "";

      return jsonError(
        targetText.includes("slug")
          ? "Property type slug already exists."
          : "Property type name already exists.",
        409,
      );
    }

    console.error("Failed to create property type:", error);

    if (process.env.NODE_ENV !== "production" && error instanceof Error) {
      return jsonError(`Failed to create property type: ${error.message}`, 500);
    }

    return jsonError("Failed to create property type.", 500);
  }
}
