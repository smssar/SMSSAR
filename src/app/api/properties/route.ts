import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, readJson, jsonFieldErrors } from "@/lib/api-utils";
import { getMessages } from "@/lib/messages";
import {
  withSubscription,
  getActiveSubscription,
} from "@/lib/getActiveSubscription";
import {
  adjustPurchaseQuantity,
  buildPlanAllowance,
  getActivePurchasesWithProduct,
  sumPurchaseQuantityByCode,
} from "@/lib/purchase-allowances";

type CreatePropertyBody = {
  title?: string;
  description?: string;
  city?: string;
  neighborhood?: string;
  area?: number;
  rooms?: number;
  bathrooms?: number;
  price?: number;
  propertyTypeId?: string;
  featured?: boolean;
  imageUrl?: string | null;
  videoUrl?: string | null;
  vedioUrl?: string | null;
  images?: Array<{ url: string; publicId: string; type: string }>;
  priceType?: string;
  forSale?: boolean;
};

export async function GET() {
  const properties = await prisma.property.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      propertyType: {
        select: { id: true, name: true, slug: true },
      },
      seller: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return NextResponse.json({ data: properties });
}

const createPropertyHandler = async (
  request: Request,
  _context: unknown,
  subscription: Exclude<
    Awaited<ReturnType<typeof getActiveSubscription>>,
    null
  >,
) => {
  const session = await auth();

  if (!session?.user?.id) {
    return jsonError("Authentication required.", 401);
  }

  if (session.user.role !== "SELLER") {
    return jsonError("Only sellers can create properties.", 403);
  }

  const userPlan = await prisma.plan.findUnique({
    where: { id: subscription.planId },
  });

  if (!userPlan) {
    return jsonError("User plan not found.", 500);
  }

  const activePurchases = await getActivePurchasesWithProduct(session.user.id);

  const extraListings = sumPurchaseQuantityByCode(
    activePurchases,
    "EXTRA_LISTINGS",
  );

  const planLimit = buildPlanAllowance(userPlan.listings, extraListings);
  const existingCount = await prisma.property.count({
    where: { sellerId: session.user.id },
  });

  // Extract locale and messages from request headers
  const localeHeader = (request.headers as Headers).get
    ? (request.headers as Headers).get("x-locale") || undefined
    : undefined;
  const messages = getMessages(localeHeader);
  const locale =
    localeHeader === "ar" || localeHeader === "fr" ? localeHeader : "en";
  const upgradeUrl = `/${locale}/pricing`;
  console.log("Plan limit:", planLimit);
  // Check if user has reached their listing limit
  if (existingCount >= planLimit) {
    if (extraListings > 0) {
      return NextResponse.json(
        {
          error:
            locale === "ar"
              ? "حد الإعلانات المسموح به في الخطة الحالية. يمكنك شراء إعلانات إضافية للمتابعة."
              : locale === "fr"
                ? "Limite d'annonces atteinte. Vous pouvez acheter des annonces supplémentaires pour continuer."
                : "Listing limit reached. You can purchase extra listings to continue.",
          code: "LISTINGS_LIMIT_WITH_PURCHASE",
          upgradeUrl,
        },
        { status: 400 },
      );
    } else {
      return NextResponse.json(
        {
          error:
            locale === "ar"
              ? "حد الإعلانات المسموح به في الخطة الحالية. يرجى ترقية الخطة أو شراء إعلانات إضافية."
              : locale === "fr"
                ? "Limite d'annonces atteinte. Veuillez mettre à niveau votre forfait ou acheter des annonces supplémentaires."
                : "Listing limit reached. Please upgrade your plan or buy extra listings.",
          code: "LISTINGS_LIMIT_REACHED",
          upgradeUrl,
        },
        { status: 400 },
      );
    }
  }

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

  const body = await readJson<CreatePropertyBody>(request);
  if (!body) {
    return jsonError("Invalid JSON body.");
  }

  const title = body.title?.trim();
  const description = body.description?.trim();
  const city = body.city?.trim();
  const neighborhood = body.neighborhood?.trim();
  const propertyTypeId = body.propertyTypeId?.trim();
  const imageUrl = body.imageUrl?.trim();
  const videoUrl = body.videoUrl?.trim() ?? body.vedioUrl?.trim();

  const fieldErrors: Record<string, string | undefined> = {};
  if (!title || title.length === 0) {
    fieldErrors.title = messages.dashboard.seller.validation.title.required;
  } else if (title.length < 3) {
    fieldErrors.title = messages.dashboard.seller.validation.title.minLength;
  }

  if (!city || city.length === 0) {
    fieldErrors.city = messages.dashboard.seller.validation.city.required;
  } else if (city.length < 2) {
    fieldErrors.city = messages.dashboard.seller.validation.city.minLength;
  }

  if (!neighborhood || neighborhood.length === 0) {
    fieldErrors.neighborhood =
      messages.dashboard.seller.validation.neighborhood.minLength;
  } else if (neighborhood.length < 2) {
    fieldErrors.neighborhood =
      messages.dashboard.seller.validation.neighborhood.minLength;
  }

  if (!propertyTypeId || propertyTypeId.length === 0) {
    fieldErrors.propertyTypeId = "Property type is required.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return jsonFieldErrors(
      fieldErrors,
      messages.dashboard.seller.validation.fixErrors,
      400,
    );
  }

  // Narrow optional values to required strings for downstream Prisma calls
  if (!title || !city || !neighborhood || !propertyTypeId) {
    return jsonFieldErrors(
      {
        title: !title
          ? messages.dashboard.seller.validation.title.required
          : undefined,
        city: !city
          ? messages.dashboard.seller.validation.city.required
          : undefined,
        neighborhood: !neighborhood
          ? messages.dashboard.seller.validation.neighborhood.minLength
          : undefined,
        propertyTypeId: !propertyTypeId
          ? "Property type is required."
          : undefined,
      },
      messages.dashboard.seller.validation.fixErrors,
      400,
    );
  }

  const neighborhoodExists = await prisma.neighborhood.findFirst({
    where: {
      city: { name: city },
      name: neighborhood,
    },
    select: { id: true },
  });

  if (!neighborhoodExists) {
    return jsonFieldErrors(
      {
        neighborhood:
          messages.dashboard.seller.validation.neighborhood.minLength,
      },
      messages.dashboard.seller.validation.fixErrors,
      400,
    );
  }

  if (videoUrl) {
    return jsonError("Video cannot be used as cover.", 400);
  }
  if (imageUrl && imageUrl.includes("/video/upload/")) {
    return jsonError("Cover must be an image.", 400);
  }

  // Verify propertyType exists
  const propertyTypeExists = await prisma.propertyType.findUnique({
    where: { id: propertyTypeId },
    select: { id: true },
  });

  if (!propertyTypeExists) {
    return jsonError(`Invalid propertyTypeId: ${propertyTypeId}`, 400);
  }

  // Verify seller exists
  const sellerExists = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, featuredproperties: true },
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
    const numericFieldErrors: Record<string, string | undefined> = {};
    if (typeof body.area !== "number") {
      numericFieldErrors.area =
        messages.dashboard.seller.validation.area.required;
    }
    if (typeof body.rooms !== "number")
      numericFieldErrors.rooms = "Rooms must be a number.";
    if (typeof body.bathrooms !== "number")
      numericFieldErrors.bathrooms = "Bathrooms must be a number.";
    if (typeof body.price !== "number")
      numericFieldErrors.price =
        messages.dashboard.seller.validation.price.required;
    return jsonFieldErrors(
      numericFieldErrors,
      messages.dashboard.seller.validation.fixErrors,
      400,
    );
  }

  const area = body.area;
  const rooms = body.rooms;
  const bathrooms = body.bathrooms;
  const price = body.price;

  const incomingImages = Array.isArray(body.images)
    ? body.images.filter((m) => m.type !== "video")
    : [];

  const extraImages = sumPurchaseQuantityByCode(
    activePurchases,
    "EXTRA_IMAGES",
  );

  const maxImages = buildPlanAllowance(
    userPlan.maxImagesPerListing,
    extraImages,
  );

  if (
    typeof userPlan.maxImagesPerListing === "number" &&
    incomingImages.length > maxImages
  ) {
    return NextResponse.json(
      {
        error:
          locale === "ar"
            ? `حد الصور المتاح لديك هو ${maxImages}.`
            : locale === "fr"
              ? `Votre limite d'images est ${maxImages}.`
              : `Your image limit is ${maxImages}.`,
        code: "PLAN_MEDIA_LIMIT_IMAGES",
        upgradeUrl,
      },
      { status: 400 },
    );
  }
  const incomingVideos = Array.isArray(body.images)
    ? body.images.filter((m) => m.type === "video")
    : [];

  const extraVideos = sumPurchaseQuantityByCode(
    activePurchases,
    "EXTRA_VIDEOS",
  );

  const maxVideos = buildPlanAllowance(
    userPlan.maxVideosPerListing,
    extraVideos,
  );

  const extraImagesToConsume = Math.max(
    0,
    incomingImages.length - (userPlan.maxImagesPerListing ?? Infinity),
  );
  const extraVideosToConsume = Math.max(
    0,
    incomingVideos.length - (userPlan.maxVideosPerListing ?? Infinity),
  );

  if (incomingVideos.length > maxVideos) {
    return NextResponse.json(
      {
        error:
          locale === "ar"
            ? `حد الفيديوهات المتاح لديك هو ${maxVideos}.`
            : locale === "fr"
              ? `Votre limite de vidéos est ${maxVideos}.`
              : `Your video limit is ${maxVideos}.`,
        code: "PLAN_MEDIA_LIMIT_VIDEOS",
        upgradeUrl,
      },
      { status: 400 },
    );
  }

  try {
    const isFeatured =
      typeof body.featured === "boolean" ? body.featured : false;

    let shouldConsumeFeaturedPurchase = false;

    if (isFeatured) {
      const featuredPurchases = sumPurchaseQuantityByCode(
        activePurchases,
        "EXTRA_FEATURED_LISTINGS",
      );

      const planFeaturedLimit = userPlan.maxFeaturedListings ?? 0;
      const maxFeatured = planFeaturedLimit + featuredPurchases;
      const currentFeatured = sellerExists.featuredproperties ?? 0;

      if (currentFeatured >= maxFeatured) {
        const code =
          maxFeatured === 0 ? "FEATURED_NOT_ALLOWED" : "FEATURED_LIMIT_REACHED";
        const message =
          maxFeatured === 0
            ? featuredNotAllowedMessage
            : featuredLimitReachedMessage(maxFeatured);

        if (maxFeatured !== 0) {
          console.log("[FEATURED LIMIT] Blocking create:", {
            userId: session.user.id,
            currentFeatured,
            planFeaturedLimit,
            featuredPurchases,
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
        featuredPurchases > 0 && currentFeatured >= planFeaturedLimit;
    }

    const imageUrlFromBody =
      typeof body.imageUrl === "string" && body.imageUrl.trim().length > 0
        ? body.imageUrl.trim()
        : null;

    const property = await prisma.$transaction(async (tx) => {
      const created = await tx.property.create({
        data: {
          title,
          description,
          city,
          neighborhood,
          area,
          rooms,
          bathrooms,
          price,
          propertyTypeId,
          sellerId: session.user.id,
          featured: isFeatured,
          imageUrl: imageUrlFromBody,
          videoUrl: null,
          priceType: body.priceType ?? "MONTHLY",
          forSale: typeof body.forSale === "boolean" ? body.forSale : false,
        },
        include: {
          propertyType: {
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

      if (isFeatured) {
        await tx.user.update({
          where: { id: session.user.id },
          data: {
            featuredproperties: {
              increment: 1,
            },
          },
        });

        if (shouldConsumeFeaturedPurchase) {
          await adjustPurchaseQuantity(
            tx,
            session.user.id,
            "EXTRA_FEATURED_LISTINGS",
            -1,
          );
        }
      }

      if (extraImagesToConsume > 0) {
        await adjustPurchaseQuantity(
          tx,
          session.user.id,
          "EXTRA_IMAGES",
          -extraImagesToConsume,
        );
      }

      if (extraVideosToConsume > 0) {
        await adjustPurchaseQuantity(
          tx,
          session.user.id,
          "EXTRA_VIDEOS",
          -extraVideosToConsume,
        );
      }

      if (extraListings > 0) {
        await adjustPurchaseQuantity(tx, session.user.id, "EXTRA_LISTINGS", -1);
      }

      return created;
    });

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
          propertyType: {
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
      return jsonError("Invalid 'propertyTypeId' or 'sellerId'.", 400);
    }

    console.error("Failed to create property:", error);

    if (process.env.NODE_ENV !== "production" && error instanceof Error) {
      return jsonError(`Failed to create property: ${error.message}`, 500);
    }

    return jsonError("Failed to create property.", 500);
  }
};
export const POST = withSubscription(createPropertyHandler);
