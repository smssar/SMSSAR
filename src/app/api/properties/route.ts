import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, readJson } from "@/lib/api-utils";

type CreatePropertyBody = {
  title?: string;
  description?: string;
  city?: string;
  neighborhood?: string;
  area?: number;
  rooms?: number;
  bathrooms?: number;
  price?: number;
  categoryId?: string;
  featured?: boolean;
  imageUrl?: string | null;
  vedioUrl?: string | null;
  images?: Array<{ url: string; publicId: string; type: string }>;
  priceType?: string;
};

export async function GET() {
  const properties = await prisma.property.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      seller: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return NextResponse.json({ data: properties });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return jsonError("Authentication required.", 401);
  }

  if (session.user.role !== "SELLER") {
    return jsonError("Only sellers can create properties.", 403);
  }

  // Check plan listing limits
  const userPlan = await prisma.plan.findUnique({
    where: { id: session.user.planId },
  });

  if (!userPlan) {
    return jsonError("User plan not found.", 500);
  }

  const planLimit = userPlan.listings ?? Infinity;

  const existingCount = await prisma.property.count({
    where: { sellerId: session.user.id },
  });

  if (existingCount >= planLimit) {
    return jsonError(
      `Your ${userPlan.id} plan allows up to ${planLimit === Infinity ? "unlimited" : planLimit} listings. You have reached the limit.`,
      400,
    );
  }

  const body = await readJson<CreatePropertyBody>(request);
  if (!body) {
    return jsonError("Invalid JSON body.");
  }

  const title = body.title?.trim();
  const description = body.description?.trim();
  const city = body.city?.trim();
  const neighborhood = body.neighborhood?.trim();
  const categoryId = body.categoryId?.trim();
  const imageUrl = body.imageUrl?.trim();
  const vedioUrl = body.vedioUrl?.trim();

  if (!title || !city || !neighborhood || !categoryId) {
    return jsonError(
      "Fields 'title', 'city', 'neighborhood', and 'categoryId' are required.",
    );
  }

  if (vedioUrl) {
    return jsonError("Video cannot be used as cover.", 400);
  }
  if (imageUrl && imageUrl.includes("/video/upload/")) {
    return jsonError("Cover must be an image.", 400);
  }

  // Verify category exists (Category.name is used as the FK)
  const categoryExists = await prisma.category.findUnique({
    where: { name: categoryId },
    select: { name: true },
  });

  if (!categoryExists) {
    return jsonError(`Invalid categoryId: ${categoryId}`, 400);
  }

  // Verify seller exists
  const sellerExists = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });

  if (!sellerExists) {
    return jsonError(`Invalid sellerId: ${session.user.id}`, 400);
  }

  if (
    typeof body.area !== "number" ||
    typeof body.rooms !== "number" ||
    typeof body.bathrooms !== "number" ||
    typeof body.price !== "number"
  ) {
    return jsonError(
      "Fields 'area', 'rooms', 'bathrooms', and 'price' must be numbers.",
    );
  }

  try {
    const imageUrlFromBody =
      typeof body.imageUrl === "string" && body.imageUrl.trim().length > 0
        ? body.imageUrl.trim()
        : null;

    const property = await prisma.property.create({
      data: {
        title,
        description,
        city,
        neighborhood,
        area: body.area,
        rooms: body.rooms,
        bathrooms: body.bathrooms,
        price: body.price,
        categoryId,
        sellerId: session.user.id,
        featured: body.featured ?? false,
        imageUrl: imageUrlFromBody,
        vedioUrl: null,
        priceType: body.priceType ?? "MONTHLY",
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        seller: {
          select: { id: true, name: true, email: true },
        },
        media: {
          select: { id: true, url: true, publicId: true, type: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // Create media records if images provided
    if (Array.isArray(body.images) && body.images.length > 0) {
      await Promise.all(
        body.images.map((image) =>
          prisma.media.create({
            data: {
              url: image.url,
              publicId: image.publicId,
              type: image.type,
              propertyId: property.id,
            },
          }),
        ),
      );

      // Fetch updated property with media
      const propertyWithMedia = await prisma.property.findUnique({
        where: { id: property.id },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          seller: {
            select: { id: true, name: true, email: true },
          },
          media: {
            select: { id: true, url: true, publicId: true, type: true },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      return NextResponse.json({ data: propertyWithMedia }, { status: 201 });
    }

    return NextResponse.json({ data: property }, { status: 201 });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2003"
    ) {
      return jsonError("Invalid 'categoryId' or 'sellerId'.", 400);
    }
    return jsonError("Failed to create property.", 500);
  }
}
