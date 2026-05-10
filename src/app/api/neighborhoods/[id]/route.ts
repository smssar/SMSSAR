import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, readJson, toSlug } from "@/lib/api-utils";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type UpdateNeighborhoodBody = {
  name_en?: string;
  name_ar?: string;
  name_fr?: string;
  slug?: string;
};

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;

  const neighborhood = await prisma.neighborhood.findUnique({
    where: { id },
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

  if (!neighborhood) {
    return jsonError("Neighborhood not found.", 404);
  }

  const propertyCount = await prisma.property.count({
    where: {
      city: neighborhood.city.name,
      neighborhood: neighborhood.name,
    },
  });

  return NextResponse.json({ data: { ...neighborhood, propertyCount } });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Authentication required.", 401);
  }
  if (session.user.role !== "ADMIN") {
    return jsonError("Only admins can update neighborhoods.", 403);
  }

  const { id } = await context.params;
  const body = await readJson<UpdateNeighborhoodBody>(request);

  if (!body) {
    return jsonError("Invalid JSON body.");
  }

  const nameEn = body.name_en?.trim();
  const nameAr = body.name_ar?.trim();
  const nameFr = body.name_fr?.trim();
  const nextSlug = body.slug?.trim();

  if (!nameEn && !nameAr && !nameFr && !nextSlug) {
    return jsonError(
      "At least one of 'name_en', 'name_ar', 'name_fr' or 'slug' is required.",
    );
  }

  const currentNeighborhood = await prisma.neighborhood.findUnique({
    where: { id },
    include: {
      city: { select: { id: true, name: true } },
    },
  });
  if (!currentNeighborhood) {
    return jsonError("Neighborhood not found.", 404);
  }

  const data: {
    name?: string;
    name_en?: string;
    name_ar?: string | null;
    name_fr?: string | null;
    slug?: string | null;
  } = {};

  if (nameEn) {
    data.name = nameEn;
    data.name_en = nameEn;
  }
  if (typeof nameAr === "string") {
    data.name_ar = nameAr;
  }
  if (typeof nameFr === "string") {
    data.name_fr = nameFr;
  }
  if (nextSlug) {
    data.slug = toSlug(nextSlug);
  } else if (nameEn) {
    data.slug = toSlug(nameEn);
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const neighborhood = await tx.neighborhood.update({
        where: { id },
        data,
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

      if (nameEn && nameEn !== currentNeighborhood.name) {
        await tx.property.updateMany({
          where: {
            city: currentNeighborhood.city.name,
            neighborhood: currentNeighborhood.name,
          },
          data: { neighborhood: nameEn },
        });
      }

      return neighborhood;
    });

    const propertyCount = await prisma.property.count({
      where: {
        city: updated.city.name,
        neighborhood: updated.name,
      },
    });

    return NextResponse.json({
      data: { ...updated, propertyCount },
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return jsonError("Neighborhood not found.", 404);
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return jsonError(
        "Neighborhood name or slug already exists for this city.",
        409,
      );
    }
    return jsonError("Failed to update neighborhood.", 500);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Authentication required.", 401);
  }
  if (session.user.role !== "ADMIN") {
    return jsonError("Only admins can delete neighborhoods.", 403);
  }

  const { id } = await context.params;

  const neighborhood = await prisma.neighborhood.findUnique({
    where: { id },
    include: {
      city: { select: { id: true, name: true } },
    },
  });

  if (!neighborhood) {
    return jsonError("Neighborhood not found.", 404);
  }

  const propertyCount = await prisma.property.count({
    where: {
      city: neighborhood.city.name,
      neighborhood: neighborhood.name,
    },
  });

  if (propertyCount > 0) {
    return jsonError(
      "Cannot delete neighborhood because properties still reference it.",
      409,
    );
  }

  await prisma.neighborhood.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
