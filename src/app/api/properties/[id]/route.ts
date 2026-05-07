import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { jsonError, readJson } from "@/lib/api-utils";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type UpdatePropertyBody = {
  title?: string;
  description?: string;
  city?: string;
  neighborhood?: string;
  area?: number;
  rooms?: number;
  bathrooms?: number;
  price?: number;
  categoryId?: string;
  sellerId?: string;
  featured?: boolean;
  imageUrl?: string | null;
  vedioUrl?: string | null;
  images?: Array<{ url: string; publicId: string; type: string }>;
  existingMedia?: Array<{ id: string; url: string; type: string }>;
  deleteMediaIds?: string[];
  priceType?: string;
};

function getCloudinaryPublicIdFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    const uploadIndex = pathname.indexOf("/upload/");
    if (uploadIndex === -1) return null;

    const parts = pathname
      .slice(uploadIndex + "/upload/".length)
      .split("/")
      .filter(Boolean);

    const versionIndex = parts.findIndex((part) => /^v\d+$/.test(part));
    const publicIdParts =
      versionIndex >= 0 ? parts.slice(versionIndex + 1) : parts;

    const withoutExtension = publicIdParts.join("/").replace(/\.[^.]+$/, "");
    return withoutExtension ? decodeURIComponent(withoutExtension) : null;
  } catch {
    return null;
  }
}

function getCloudinaryResourceTypeFromUrl(url: string): "image" | "video" {
  return url.includes("/video/upload/") ? "video" : "image";
}

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      seller: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!property) {
    return jsonError("Property not found.", 404);
  }

  return NextResponse.json({ data: property });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Authentication required.", 401);
  }

  const { id } = await context.params;

  // Check if property exists and belongs to the seller (if seller)
  if (session.user.role === "SELLER") {
    const property = await prisma.property.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!property) {
      return jsonError("Property not found.", 404);
    }

    if (property.sellerId !== session.user.id) {
      return jsonError("You can only update your own properties.", 403);
    }
  } else if (session.user.role !== "ADMIN") {
    return jsonError("Only admins and sellers can update properties.", 403);
  }

  const body = await readJson<UpdatePropertyBody>(request);

  if (!body) {
    return jsonError("Invalid JSON body.");
  }

  const imageUrl = body.imageUrl?.trim();
  const vedioUrl = body.vedioUrl?.trim();
  if (vedioUrl) {
    return jsonError("Video cannot be used as cover.", 400);
  }
  if (imageUrl && imageUrl.includes("/video/upload/")) {
    return jsonError("Cover must be an image.", 400);
  }

  const existingProperty = await prisma.property.findUnique({
    where: { id },
    select: {
      imageUrl: true,
      vedioUrl: true,
      media: {
        select: { id: true, url: true, publicId: true, type: true },
      },
    },
  });

  if (!existingProperty) {
    return jsonError("Property not found.", 404);
  }

  const data: {
    title?: string;
    description?: string;
    city?: string;
    neighborhood?: string | null;
    priceType?: string;
    area?: number;
    rooms?: number;
    bathrooms?: number;
    price?: number;
    categoryId?: string;
    featured?: boolean;
    imageUrl?: string | null;
    vedioUrl?: string | null;
  } = {};

  if (typeof body.title === "string") {
    data.title = body.title.trim();
  }
  if (typeof body.description === "string") {
    data.description = body.description.trim();
  }
  if (typeof body.city === "string") {
    data.city = body.city.trim();
  }
  if (typeof body.neighborhood === "string") {
    data.neighborhood = body.neighborhood.trim();
  }
  if (typeof body.area === "number") {
    data.area = body.area;
  }
  if (typeof body.rooms === "number") {
    data.rooms = body.rooms;
  }
  if (typeof body.bathrooms === "number") {
    data.bathrooms = body.bathrooms;
  }
  if (typeof body.price === "number") {
    data.price = body.price;
  }
  if (typeof body.categoryId === "string") {
    data.categoryId = body.categoryId.trim();
  }
  if (typeof body.featured === "boolean") {
    data.featured = body.featured;
  }
  if (typeof body.imageUrl === "string" || body.imageUrl === null) {
    data.imageUrl = body.imageUrl;
  }
  if (typeof body.vedioUrl === "string" || body.vedioUrl === null) {
    data.vedioUrl = body.vedioUrl;
  }

  if (typeof body.priceType === "string") {
    data.priceType = body.priceType.trim();
  }

  if (data.title !== undefined && data.title.length === 0) {
    return jsonError("Title is required.", 400);
  }
  if (data.city !== undefined && data.city.length === 0) {
    return jsonError("City is required.", 400);
  }
  if (!data.neighborhood || data.neighborhood.length === 0) {
    return jsonError("Neighborhood is required.", 400);
  }
  if (data.categoryId !== undefined && data.categoryId.length === 0) {
    return jsonError("Category is required.", 400);
  }

  const hasFieldUpdates = Object.keys(data).length > 0;
  const hasMediaUpdates =
    (Array.isArray(body.deleteMediaIds) && body.deleteMediaIds.length > 0) ||
    (Array.isArray(body.images) && body.images.length > 0);

  if (!hasFieldUpdates && !hasMediaUpdates) {
    return jsonError("No valid fields provided for update.");
  }

  try {
    const retainedExistingMediaIds = new Set(
      Array.isArray(body.existingMedia)
        ? body.existingMedia.map((media) => media.id)
        : [],
    );

    const explicitDeleteMediaIds = new Set(
      Array.isArray(body.deleteMediaIds) ? body.deleteMediaIds : [],
    );

    for (const media of existingProperty.media) {
      if (!retainedExistingMediaIds.has(media.id)) {
        explicitDeleteMediaIds.add(media.id);
      }
    }

    if (explicitDeleteMediaIds.size > 0) {
      const mediaToDelete = await prisma.media.findMany({
        where: {
          id: { in: Array.from(explicitDeleteMediaIds) },
          propertyId: id,
        },
        select: { publicId: true, type: true },
      });

      // attempt to destroy assets in Cloudinary (best-effort)
      await Promise.all(
        mediaToDelete.map(async (m) => {
          try {
            await cloudinary.uploader.destroy(m.publicId, {
              resource_type: m.type === "video" ? "video" : "image",
            });
          } catch (err) {
            // ignore errors here — we'll still remove DB rows
            console.error(
              "Failed to destroy cloudinary asset",
              m.publicId,
              err,
            );
          }
        }),
      );

      await prisma.media.deleteMany({
        where: {
          id: { in: Array.from(explicitDeleteMediaIds) },
          propertyId: id,
        },
      });
    }

    // Create new media if provided
    if (Array.isArray(body.images) && body.images.length > 0) {
      await Promise.all(
        body.images.map((image) =>
          prisma.media.create({
            data: {
              url: image.url,
              publicId: image.publicId,
              type: image.type,
              propertyId: id,
            },
          }),
        ),
      );
    }

    const selectedCoverUrl =
      typeof body.imageUrl === "string" && body.imageUrl.trim().length > 0
        ? body.imageUrl.trim()
        : null;

    if (selectedCoverUrl) {
      const selectedCoverAlreadyExists = await prisma.media.findFirst({
        where: {
          propertyId: id,
          url: selectedCoverUrl,
        },
        select: { id: true },
      });

      if (!selectedCoverAlreadyExists) {
        const publicId = getCloudinaryPublicIdFromUrl(selectedCoverUrl);
        if (publicId) {
          await prisma.media.create({
            data: {
              url: selectedCoverUrl,
              publicId,
              type: getCloudinaryResourceTypeFromUrl(selectedCoverUrl),
              propertyId: id,
            },
          });
        }
      }
    }

    if (
      existingProperty.imageUrl &&
      typeof body.imageUrl === "string" &&
      body.imageUrl.trim() &&
      body.imageUrl.trim() !== existingProperty.imageUrl
    ) {
      const oldCoverUrl = existingProperty.imageUrl;
      const oldCoverExistsInMedia = existingProperty.media.some(
        (media) => media.url === oldCoverUrl,
      );

      if (!oldCoverExistsInMedia) {
        const publicId = getCloudinaryPublicIdFromUrl(oldCoverUrl);
        if (publicId) {
          await prisma.media.create({
            data: {
              url: oldCoverUrl,
              publicId,
              type: getCloudinaryResourceTypeFromUrl(oldCoverUrl),
              propertyId: id,
            },
          });
        }
      }
    }

    if (
      existingProperty.vedioUrl &&
      typeof body.vedioUrl === "string" &&
      body.vedioUrl.trim() &&
      body.vedioUrl.trim() !== existingProperty.vedioUrl
    ) {
      const oldCoverUrl = existingProperty.vedioUrl;
      const oldCoverExistsInMedia = existingProperty.media.some(
        (media) => media.url === oldCoverUrl,
      );

      if (!oldCoverExistsInMedia) {
        const publicId = getCloudinaryPublicIdFromUrl(oldCoverUrl);
        if (publicId) {
          await prisma.media.create({
            data: {
              url: oldCoverUrl,
              publicId,
              type: getCloudinaryResourceTypeFromUrl(oldCoverUrl),
              propertyId: id,
            },
          });
        }
      }
    }

    const include = {
      category: {
        select: { id: true, name: true, slug: true },
      },
      seller: {
        select: { id: true, name: true, email: true },
      },
      media: {
        select: { id: true, url: true, publicId: true, type: true },
        orderBy: { createdAt: "asc" as const },
      },
    };

    const property = hasFieldUpdates
      ? await prisma.property.update({
          where: { id },
          data,
          include,
        })
      : await prisma.property.findUnique({
          where: { id },
          include,
        });

    if (!property) {
      return jsonError("Property not found.", 404);
    }

    return NextResponse.json({ data: property });
  } catch (error: unknown) {
    console.error("Failed to update property:", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return jsonError("Property not found.", 404);
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2003"
    ) {
      return jsonError(
        "Invalid relation reference for category or seller.",
        400,
      );
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2022"
    ) {
      return jsonError("Database schema is out of sync.", 500);
    }
    return jsonError("Failed to update property.", 500);
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Authentication required.", 401);
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "SELLER") {
    return jsonError("Only admins can delete properties.", 403);
  }

  const { id } = await context.params;

  try {
    await prisma.property.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return jsonError("Property not found.", 404);
    }
    return jsonError("Failed to delete property.", 500);
  }
}
