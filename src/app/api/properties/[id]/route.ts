import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { jsonError, readJson, jsonFieldErrors } from "@/lib/api-utils";
import { getMessages } from "@/lib/messages";
import {
  adjustFeaturedPropertiesCount,
  adjustPurchaseQuantity,
  getActivePurchasesWithProduct,
  sumPurchaseQuantityByCode,
} from "@/lib/purchase-allowances";
import { resolvePlanForRole } from "@/lib/role-pricing";

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
  propertyTypeId?: string;
  sellerId?: string;
  featured?: boolean;
  imageUrl?: string | null;
  videoUrl?: string | null;
  vedioUrl?: string | null;
  images?: Array<{ url: string; publicId: string; type: string }>;
  existingMedia?: Array<{ id: string; url: string; type: string }>;
  deleteMediaIds?: string[];
  priceType?: string;
  forSale?: boolean;
  isVerified?: boolean;
  isAvailable?: boolean;
  updateSomeFields?: boolean;
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

function getExtraQuantityDelta(
  existingCount: number,
  nextCount: number,
  planLimit: number | null | undefined,
) {
  if (planLimit === null || planLimit === undefined) return 0;

  const previousExtra = Math.max(0, existingCount - planLimit);
  const nextExtra = Math.max(0, nextCount - planLimit);
  return previousExtra - nextExtra;
}

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      propertyType: { select: { id: true, name: true, slug: true } },
      seller: { select: { id: true, name: true, email: true } },
    },
  });
  if (!property) return jsonError("Property not found.", 404);
  return NextResponse.json({ data: property });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Authentication required.", 401);

  const { id } = await context.params;

  if (session.user.role === "SELLER" || session.user.role === "SMSSAR") {
    const property = await prisma.property.findUnique({
      where: { id },
      select: { sellerId: true },
    });
    if (!property) return jsonError("Property not found.", 404);
    if (property.sellerId !== session.user.id)
      return jsonError("You can only update your own properties.", 403);
  } else if (session.user.role !== "ADMIN") {
    return jsonError("Only admins and sellers can update properties.", 403);
  }

  const body = await readJson<UpdatePropertyBody>(request);
  if (!body) return jsonError("Invalid JSON body.");

  const imageUrl = body.imageUrl?.trim();
  const videoUrl = body.videoUrl?.trim() ?? body.vedioUrl?.trim();
  if (videoUrl) return jsonError("Video cannot be used as cover.", 400);
  if (imageUrl && imageUrl.includes("/video/upload/"))
    return jsonError("Cover must be an image.", 400);

  // Fetch existing property + media
  const existingProperty = await prisma.property.findUnique({
    where: { id },
    select: {
      city: true,
      neighborhood: true,
      imageUrl: true,
      videoUrl: true,
      featured: true,
      sellerId: true,
      media: {
        select: { id: true, url: true, publicId: true, type: true },
      },
    },
  });
  if (!existingProperty) return jsonError("Property not found.", 404);

  // -------------------------------------------------------------------------
  // Load seller plan + active purchases (mirrors POST handler)
  // -------------------------------------------------------------------------
  const sellerAccount = await prisma.user.findUnique({
    where: { id: existingProperty.sellerId },
    select: { id: true, planId: true, featuredproperties: true },
  });

  const sellerPlan = sellerAccount?.planId
    ? await prisma.plan.findUnique({
        where: { id: sellerAccount.planId },
      })
    : null;

  const effectiveSellerPlan = sellerPlan
    ? resolvePlanForRole(sellerPlan, session.user.role)
    : null;

  // All ACTIVE purchases for the seller — same query as POST
  const activePurchases = sellerAccount
    ? await getActivePurchasesWithProduct(sellerAccount.id)
    : [];

  const extraImages = sumPurchaseQuantityByCode(
    activePurchases,
    "EXTRA_IMAGES",
  );

  const extraVideos = sumPurchaseQuantityByCode(
    activePurchases,
    "EXTRA_VIDEOS",
  );

  const extraFeatured = sumPurchaseQuantityByCode(
    activePurchases,
    "EXTRA_FEATURED_LISTINGS",
  );

  let shouldConsumeFeaturedPurchase = false;

  // -------------------------------------------------------------------------
  // Locale helpers
  // -------------------------------------------------------------------------
  const localeHeader = (request.headers as Headers).get
    ? (request.headers as Headers).get("x-locale") || undefined
    : undefined;
  const messages = getMessages(localeHeader);
  const locale =
    localeHeader === "ar" || localeHeader === "fr" ? localeHeader : "en";
  const upgradeUrl = `/${locale}/pricing`;

  const featuredNotAllowedMessage =
    locale === "ar"
      ? "الخطة الحالية لا تسمح بالعقارات المميزة."
      : locale === "fr"
        ? "Votre forfait actuel n'autorise pas les annonces en vedette."
        : "Your current plan does not allow featured listings.";

  const featuredLimitReachedMessage = (maxFeatured: number) =>
    locale === "ar"
      ? `خطتك تسمح بحد أقصى ${maxFeatured} عقار${maxFeatured === 1 ? "" : "ات"} مميز. لقد وصلت إلى الحد.`
      : locale === "fr"
        ? `Votre forfait autorise jusqu'a ${maxFeatured} annonce${maxFeatured === 1 ? "" : "s"} en vedette. Vous avez atteint la limite.`
        : `Your plan allows up to ${maxFeatured} featured listing${maxFeatured === 1 ? "" : "s"}. You have reached the limit.`;

  // -------------------------------------------------------------------------
  // Build update data object
  // -------------------------------------------------------------------------
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
    propertyTypeId?: string | null;
    featured?: boolean;
    imageUrl?: string | null;
    videoUrl?: string | null;
    forSale?: boolean;
    sellerId?: string;
    isVerified?: boolean;
    isAvailable?: boolean;
  } = {};

  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.description === "string")
    data.description = body.description.trim();
  if (typeof body.city === "string") data.city = body.city.trim();
  if (typeof body.neighborhood === "string")
    data.neighborhood = body.neighborhood.trim();
  if (typeof body.area === "number") data.area = body.area;
  if (typeof body.rooms === "number") data.rooms = body.rooms;
  if (typeof body.bathrooms === "number") data.bathrooms = body.bathrooms;
  if (typeof body.price === "number") data.price = body.price;
  if (typeof body.propertyTypeId === "string")
    data.propertyTypeId = body.propertyTypeId.trim();
  if (body.propertyTypeId === null) data.propertyTypeId = null;
  if (typeof body.sellerId === "string") data.sellerId = body.sellerId.trim();
  if (typeof body.featured === "boolean") data.featured = body.featured;
  if (typeof body.imageUrl === "string" || body.imageUrl === null)
    data.imageUrl = body.imageUrl;
  if (typeof body.videoUrl === "string" || body.videoUrl === null) {
    data.videoUrl = body.videoUrl;
  } else if (typeof body.vedioUrl === "string" || body.vedioUrl === null) {
    data.videoUrl = body.vedioUrl;
  }
  if (typeof body.forSale === "boolean") data.forSale = body.forSale;
  if (typeof body.isVerified === "boolean") data.isVerified = body.isVerified;
  if (typeof body.isAvailable === "boolean")
    data.isAvailable = body.isAvailable;
  if (typeof body.priceType === "string")
    data.priceType = body.priceType.trim();

  // -------------------------------------------------------------------------
  // Field validation
  // -------------------------------------------------------------------------
  if (
    data.title !== undefined &&
    data.title.length === 0 &&
    body.updateSomeFields !== true
  )
    return jsonFieldErrors(
      { title: messages.dashboard.seller.validation.title.required },
      messages.dashboard.seller.validation.fixErrors,
      400,
    );

  if (
    data.city !== undefined &&
    data.city.length === 0 &&
    body.updateSomeFields !== true
  )
    return jsonFieldErrors(
      { city: messages.dashboard.seller.validation.city.required },
      messages.dashboard.seller.validation.fixErrors,
      400,
    );

  if (
    data.neighborhood !== undefined &&
    data.neighborhood !== null &&
    data.neighborhood.length === 0 &&
    body.updateSomeFields !== true
  )
    return jsonFieldErrors(
      {
        neighborhood:
          messages.dashboard.seller.validation.neighborhood.minLength,
      },
      messages.dashboard.seller.validation.fixErrors,
      400,
    );

  if (
    data.propertyTypeId !== undefined &&
    data.propertyTypeId !== null &&
    data.propertyTypeId.length === 0 &&
    body.updateSomeFields !== true
  )
    return jsonFieldErrors(
      { propertyTypeId: "Property type is required." },
      messages.dashboard.seller.validation.fixErrors,
      400,
    );

  // Neighborhood existence check
  const nextCity = data.city ?? existingProperty.city;
  const nextNeighborhood = data.neighborhood ?? existingProperty.neighborhood;
  if (nextCity && nextNeighborhood) {
    const neighborhoodExists = await prisma.neighborhood.findFirst({
      where: { city: { name: nextCity }, name: nextNeighborhood },
      select: { id: true },
    });
    if (!neighborhoodExists)
      return jsonFieldErrors(
        {
          neighborhood:
            messages.dashboard.seller.validation.neighborhood.minLength,
        },
        messages.dashboard.seller.validation.fixErrors,
        400,
      );
  }

  // -------------------------------------------------------------------------
  // Featured limit check — now includes extraFeatured from purchases
  // -------------------------------------------------------------------------
  if (data.featured === true && !existingProperty.featured) {
    if (session.user.role === "SELLER" || session.user.role === "SMSSAR") {
      if (!sellerPlan) return jsonError("User plan not found.", 500);

      const planFeaturedLimit = effectiveSellerPlan?.maxFeaturedListings ?? 0;
      const maxFeatured = planFeaturedLimit + extraFeatured; // ← purchases included
      const currentFeatured = sellerAccount?.featuredproperties ?? 0;

      if (currentFeatured >= maxFeatured) {
        const code =
          maxFeatured === 0 ? "FEATURED_NOT_ALLOWED" : "FEATURED_LIMIT_REACHED";
        const message =
          maxFeatured === 0
            ? featuredNotAllowedMessage
            : featuredLimitReachedMessage(maxFeatured);

        if (maxFeatured !== 0) {
          console.log("[FEATURED LIMIT] Blocking update:", {
            sellerId: existingProperty.sellerId,
            currentFeatured,
            planFeaturedLimit,
            extraFeatured,
            maxFeatured,
          });
        }

        return NextResponse.json(
          {
            error: message,
            code,
            upgradeUrl,
          },
          { status: 400 },
        );
      }

      shouldConsumeFeaturedPurchase =
        extraFeatured > 0 && currentFeatured >= planFeaturedLimit;
    }
  }

  // -------------------------------------------------------------------------
  // Media limit check — now includes extraImages / extraVideos from purchases
  // -------------------------------------------------------------------------
  const hasFieldUpdates = Object.keys(data).length > 0;
  const hasMediaUpdates =
    (Array.isArray(body.deleteMediaIds) && body.deleteMediaIds.length > 0) ||
    (Array.isArray(body.images) && body.images.length > 0);

  if (!hasFieldUpdates && !hasMediaUpdates)
    return jsonError("No valid fields provided for update.");

  if (sellerPlan) {
    const retainedExistingIds = new Set(
      Array.isArray(body.existingMedia)
        ? body.existingMedia.map((m) => m.id)
        : existingProperty.media.map((m) => m.id),
    );
    const retainedExisting = existingProperty.media.filter((m) =>
      retainedExistingIds.has(m.id),
    );

    const retainedImageCount = retainedExisting.filter(
      (m) => m.type !== "video",
    ).length;
    const retainedVideoCount = retainedExisting.filter(
      (m) => m.type === "video",
    ).length;

    const incomingImages = Array.isArray(body.images)
      ? body.images.filter((m) => m.type !== "video").length
      : 0;
    const incomingVideos = Array.isArray(body.images)
      ? body.images.filter((m) => m.type === "video").length
      : 0;

    const nextImageCount = retainedImageCount + incomingImages;
    const nextVideoCount = retainedVideoCount + incomingVideos;

    // Max = plan limit + purchased extras
    const maxImages =
      (effectiveSellerPlan?.maxImagesPerListing ?? 0) + extraImages;
    const maxVideos =
      effectiveSellerPlan?.maxVideosPerListing === null
        ? Infinity
        : (effectiveSellerPlan?.maxVideosPerListing ?? 0) + extraVideos;

    if (
      typeof effectiveSellerPlan?.maxImagesPerListing === "number" &&
      nextImageCount > maxImages
    ) {
      return NextResponse.json(
        {
          error:
            locale === "ar"
              ? `حد الصور في باقتك هو ${maxImages}.`
              : locale === "fr"
                ? `La limite d'images de votre forfait est ${maxImages}.`
                : `Your plan image limit is ${maxImages}.`,
          code: "PLAN_MEDIA_LIMIT_IMAGES",
          upgradeUrl,
        },
        { status: 400 },
      );
    }

    if (nextVideoCount > maxVideos) {
      return NextResponse.json(
        {
          error:
            locale === "ar"
              ? `حد الفيديوهات في باقتك هو ${maxVideos === Infinity ? "غير محدود" : maxVideos}.`
              : locale === "fr"
                ? `La limite de videos de votre forfait est ${maxVideos === Infinity ? "illimitée" : maxVideos}.`
                : `Your plan video limit is ${maxVideos === Infinity ? "unlimited" : maxVideos}.`,
          code: "PLAN_MEDIA_LIMIT_VIDEOS",
          upgradeUrl,
        },
        { status: 400 },
      );
    }
  }

  try {
    const retainedExistingMediaIds = new Set(
      Array.isArray(body.existingMedia)
        ? body.existingMedia.map((m) => m.id)
        : [],
    );
    const explicitDeleteMediaIds = new Set(
      Array.isArray(body.deleteMediaIds) ? body.deleteMediaIds : [],
    );

    // Any media not in retainedExistingMediaIds gets deleted
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

      // Best-effort Cloudinary cleanup
      await Promise.all(
        mediaToDelete.map(async (m) => {
          try {
            await cloudinary.uploader.destroy(m.publicId, {
              resource_type: m.type === "video" ? "video" : "image",
            });
          } catch (err) {
            console.error(
              "Failed to destroy cloudinary asset",
              m.publicId,
              err,
            );
          }
        }),
      );
    }

    const incomingImages = Array.isArray(body.images)
      ? body.images.filter((m) => m.type !== "video")
      : [];
    const incomingVideos = Array.isArray(body.images)
      ? body.images.filter((m) => m.type === "video")
      : [];

    const existingImageCount = existingProperty.media.filter(
      (m) => m.type !== "video",
    ).length;
    const existingVideoCount = existingProperty.media.filter(
      (m) => m.type === "video",
    ).length;

    const retainedExistingImageCount = existingProperty.media.filter(
      (m) => retainedExistingMediaIds.has(m.id) && m.type !== "video",
    ).length;
    const retainedExistingVideoCount = existingProperty.media.filter(
      (m) => retainedExistingMediaIds.has(m.id) && m.type === "video",
    ).length;

    const nextImageCount = retainedExistingImageCount + incomingImages.length;
    const nextVideoCount = retainedExistingVideoCount + incomingVideos.length;

    const imageQuantityDelta = getExtraQuantityDelta(
      existingImageCount,
      nextImageCount,
      effectiveSellerPlan?.maxImagesPerListing,
    );
    const videoQuantityDelta = getExtraQuantityDelta(
      existingVideoCount,
      nextVideoCount,
      effectiveSellerPlan?.maxVideosPerListing,
    );

    const property = await prisma.$transaction(async (tx) => {
      if (explicitDeleteMediaIds.size > 0) {
        await tx.media.deleteMany({
          where: {
            id: { in: Array.from(explicitDeleteMediaIds) },
            propertyId: id,
          },
        });
      }

      if (incomingImages.length > 0) {
        await Promise.all(
          incomingImages.map((image) =>
            tx.media.create({
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
        const coverExists = await tx.media.findFirst({
          where: { propertyId: id, url: selectedCoverUrl },
          select: { id: true },
        });
        if (!coverExists) {
          const publicId = getCloudinaryPublicIdFromUrl(selectedCoverUrl);
          if (publicId) {
            await tx.media.create({
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
          (m) => m.url === oldCoverUrl,
        );
        if (!oldCoverExistsInMedia) {
          const publicId = getCloudinaryPublicIdFromUrl(oldCoverUrl);
          if (publicId) {
            await tx.media.create({
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
        existingProperty.videoUrl &&
        typeof (body.videoUrl ?? body.vedioUrl) === "string" &&
        (body.videoUrl ?? body.vedioUrl)?.trim() &&
        (body.videoUrl ?? body.vedioUrl)?.trim() !== existingProperty.videoUrl
      ) {
        const oldCoverUrl = existingProperty.videoUrl;
        const oldCoverExistsInMedia = existingProperty.media.some(
          (m) => m.url === oldCoverUrl,
        );
        if (!oldCoverExistsInMedia) {
          const publicId = getCloudinaryPublicIdFromUrl(oldCoverUrl);
          if (publicId) {
            await tx.media.create({
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
        propertyType: { select: { id: true, name: true, slug: true } },
        seller: { select: { id: true, name: true, email: true } },
        media: {
          select: { id: true, url: true, publicId: true, type: true },
          orderBy: { createdAt: "asc" as const },
        },
      };

      const willBeFeatured =
        data.featured === true && !existingProperty.featured;
      const willBeUnfeatured =
        data.featured === false && existingProperty.featured;

      let updatedProperty;

      if (hasFieldUpdates) {
        if (willBeFeatured || willBeUnfeatured) {
          updatedProperty = await tx.property.update({
            where: { id },
            data,
            include,
          });
          if (willBeFeatured) {
            await adjustFeaturedPropertiesCount(
              tx,
              existingProperty.sellerId,
              1,
            );
            if (shouldConsumeFeaturedPurchase) {
              await adjustPurchaseQuantity(
                tx,
                existingProperty.sellerId,
                "EXTRA_FEATURED_LISTINGS",
                -1,
              );
            }
          }
          if (willBeUnfeatured) {
            await adjustFeaturedPropertiesCount(
              tx,
              existingProperty.sellerId,
              -1,
            );
          }
        } else {
          updatedProperty = await tx.property.update({
            where: { id },
            data,
            include,
          });
        }
      } else {
        updatedProperty = await tx.property.findUnique({
          where: { id },
          include,
        });
      }

      if (imageQuantityDelta !== 0) {
        await adjustPurchaseQuantity(
          tx,
          existingProperty.sellerId,
          "EXTRA_IMAGES",
          imageQuantityDelta,
        );
      }

      if (videoQuantityDelta !== 0) {
        await adjustPurchaseQuantity(
          tx,
          existingProperty.sellerId,
          "EXTRA_VIDEOS",
          videoQuantityDelta,
        );
      }

      return updatedProperty;
    });

    if (!property) return jsonError("Property not found.", 404);
    return NextResponse.json({ data: property });
  } catch (error: unknown) {
    console.error("Failed to update property:", error);
    if (typeof error === "object" && error !== null && "code" in error) {
      const code = (error as { code: string }).code;
      if (code === "P2025") return jsonError("Property not found.", 404);
      if (code === "P2003")
        return jsonError(
          "Invalid relation reference for property type or seller.",
          400,
        );
      if (code === "P2022")
        return jsonError("Database schema is out of sync.", 500);
    }
    return jsonError("Failed to update property.", 500);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/properties/[id]
// ---------------------------------------------------------------------------

export async function DELETE(_: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Authentication required.", 401);

  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "SELLER" &&
    session.user.role !== "SMSSAR"
  )
    return jsonError("Only admins can delete properties.", 403);

  const { id } = await context.params;

  try {
    const propertyToDelete = await prisma.property.findUnique({
      where: { id },
      select: { featured: true, sellerId: true },
    });
    if (!propertyToDelete) return jsonError("Property not found.", 404);

    if (
      (session.user.role === "SELLER" || session.user.role === "SMSSAR") &&
      propertyToDelete.sellerId !== session.user.id
    )
      return jsonError("You can only delete your own properties.", 403);

    await prisma.$transaction(async (tx) => {
      await tx.property.delete({ where: { id } });
      if (propertyToDelete.featured) {
        await adjustFeaturedPropertiesCount(tx, propertyToDelete.sellerId, -1);
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    )
      return jsonError("Property not found.", 404);
    return jsonError("Failed to delete property.", 500);
  }
}
