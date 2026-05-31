import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, readJson, jsonFieldErrors } from "@/lib/api-utils";
import { getMessages } from "@/lib/messages";
import {
  withSubscription,
  getActiveSubscription,
} from "@/lib/getActiveSubscription";

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

  const localeHeader = (request.headers as Headers).get
    ? (request.headers as Headers).get("x-locale") || undefined
    : undefined;
  const messages = getMessages(localeHeader);
  const locale =
    localeHeader === "ar" || localeHeader === "fr" ? localeHeader : "en";

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

  // Server-side validation with localized field errors
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

  try {
    // Check featured property limit if user is trying to feature this property
    const isFeatured =
      typeof body.featured === "boolean" ? body.featured : false;

    if (isFeatured) {
      // A listing can only be featured when the active plan supports featured listings.
      if (!userPlan.featured) {
        return jsonError(featuredNotAllowedMessage, 400);
      }

      const maxFeatured = userPlan.maxFeaturedListings;
      const currentFeatured = sellerExists.featuredproperties ?? 0;

      if (typeof maxFeatured === "number" && currentFeatured >= maxFeatured) {
        console.log(
          "[FEATURED LIMIT] Blocking create: userId=",
          session.user.id,
          "currentFeatured=",
          currentFeatured,
          "maxFeatured=",
          maxFeatured,
        );
        return jsonError(featuredLimitReachedMessage(maxFeatured), 400);
      }
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
      }

      return created;
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
