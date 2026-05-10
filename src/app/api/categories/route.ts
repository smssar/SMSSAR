import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, readJson, toSlug } from "@/lib/api-utils";

export const runtime = "nodejs";

type CreatePropertyTypeBody = {
  name_en?: string;
  name_ar?: string;
  name_fr?: string;
  slug?: string;
};

export async function GET() {
  const propertyTypes = await prisma.propertyType.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { properties: true },
      },
    },
  });

  return NextResponse.json({ data: propertyTypes });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return jsonError("Authentication required.", 401);
  }

  if (session.user.role !== "ADMIN") {
    return jsonError("Only admins can create property types.", 403);
  }

  const body = await readJson<CreatePropertyTypeBody>(request);
  if (!body) {
    return jsonError("Invalid JSON body.");
  }

  const nameEn = body.name_en?.trim();
  const nameAr = body.name_ar?.trim() || "";
  const nameFr = body.name_fr?.trim() || "";

  if (!nameEn) {
    return jsonError("Field 'name_en' is required.");
  }

  const slug = body.slug?.trim() || toSlug(nameEn);
  if (!slug) {
    return jsonError("Field 'slug' is invalid.");
  }

  try {
    const payload = JSON.parse(
      JSON.stringify({
        name: nameEn,
        name_en: nameEn,
        name_ar: nameAr,
        name_fr: nameFr,
        slug,
      }),
    );

    const propertyType = await prisma.propertyType.create({ data: payload });
    return NextResponse.json({ data: propertyType }, { status: 201 });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return jsonError("Property type slug already exists.", 409);
    }
    return jsonError("Failed to create property type.", 500);
  }
}
