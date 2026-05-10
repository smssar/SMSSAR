import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, readJson, toSlug } from "@/lib/api-utils";

export const runtime = "nodejs";

type CreateNeighborhoodBody = {
  cityId?: string;
  name_en?: string;
  name_ar?: string;
  name_fr?: string;
  slug?: string;
};

export async function GET() {
  const [neighborhoods, counts] = await Promise.all([
    prisma.neighborhood.findMany({
      include: {
        city: {
          select: {
            id: true,
            name: true,
            name_ar: true,
            name_fr: true,
            slug: true,
          },
        },
      },
      orderBy: [{ city: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.property.groupBy({
      by: ["city", "neighborhood"],
      where: { neighborhood: { not: null } },
      _count: { neighborhood: true },
    }),
  ]);

  const countMap = new Map(
    counts.map((item) => [
      `${item.city}::${item.neighborhood}`,
      item._count.neighborhood,
    ]),
  );

  return NextResponse.json({
    data: neighborhoods.map((neighborhood) => ({
      ...neighborhood,
      propertyCount:
        countMap.get(`${neighborhood.city.name}::${neighborhood.name}`) ?? 0,
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return jsonError("Authentication required.", 401);
  }

  if (session.user.role !== "ADMIN") {
    return jsonError("Only admins can create neighborhoods.", 403);
  }

  const body = await readJson<CreateNeighborhoodBody>(request);
  if (!body) {
    return jsonError("Invalid JSON body.");
  }

  const cityId = body.cityId?.trim();
  const nameEn = body.name_en?.trim();
  const nameAr = body.name_ar?.trim() || null;
  const nameFr = body.name_fr?.trim() || null;

  if (!cityId) {
    return jsonError("Field 'cityId' is required.");
  }
  if (!nameEn) {
    return jsonError("Field 'name_en' is required.");
  }

  const city = await prisma.city.findUnique({
    where: { id: cityId },
    select: { id: true },
  });
  if (!city) {
    return jsonError("City not found.", 404);
  }

  const slug = body.slug?.trim() || toSlug(nameEn);

  try {
    const neighborhood = await prisma.neighborhood.create({
      data: {
        cityId,
        name: nameEn,
        name_en: nameEn,
        name_ar: nameAr,
        name_fr: nameFr,
        slug,
      },
      include: {
        city: {
          select: {
            id: true,
            name: true,
            name_ar: true,
            name_fr: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(
      { data: { ...neighborhood, propertyCount: 0 } },
      { status: 201 },
    );
  } catch (error: unknown) {
    const prismaCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
        ? ((error as { code: string }).code as string)
        : null;

    if (prismaCode === "P2002") {
      return jsonError(
        "Neighborhood name or slug already exists for this city.",
        409,
      );
    }

    console.error("Failed to create neighborhood:", error);

    if (process.env.NODE_ENV !== "production" && error instanceof Error) {
      return jsonError(`Failed to create neighborhood: ${error.message}`, 500);
    }

    return jsonError("Failed to create neighborhood.", 500);
  }
}
