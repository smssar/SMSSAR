import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, readJson } from "@/lib/api-utils";
import {
  withSubscription,
  getActiveSubscription,
} from "@/lib/getActiveSubscription";

export const runtime = "nodejs";

type CreatePlanBody = {
  id?: string;
  title?: string;
  title_ar?: string;
  title_fr?: string;
  description?: string;
  description_ar?: string;
  description_fr?: string;
  price?: number;
  listings?: number | null;
  featured?: boolean;
  ads?: number | null;
  adsduration?: number | null;
  maxFeaturedListings?: number | null;
  maxImagesPerListing?: number | null;
  maxVideosPerListing?: number | null;
};

export async function GET() {
  const plans = await prisma.plan.findMany({ orderBy: { price: "asc" } });
  return NextResponse.json({ data: plans });
}

const createPlanHandler = async (
  request: Request,
  _context: unknown,
  _subscription: Exclude<
    Awaited<ReturnType<typeof getActiveSubscription>>,
    null
  >,
) => {
  void _context;
  void _subscription;
  const session = await auth();

  if (!session?.user?.id) {
    return jsonError("Authentication required.", 401);
  }

  if (session.user.role !== "ADMIN") {
    return jsonError("Only admins can create plans.", 403);
  }

  const body = await readJson<CreatePlanBody>(request);
  if (!body) {
    return jsonError("Invalid JSON body.");
  }

  const id = body.id?.trim().toLowerCase();
  const title = body.title?.trim();
  const description = body.description?.trim();

  if (!id || !title || !description) {
    return jsonError("Fields 'id', 'title', and 'description' are required.");
  }

  try {
    const plan = await prisma.plan.create({
      data: {
        id,
        title,
        title_ar: body.title_ar?.trim() || null,
        title_fr: body.title_fr?.trim() || null,
        description,
        description_ar: body.description_ar?.trim() || null,
        description_fr: body.description_fr?.trim() || null,
        price: Number(body.price ?? 0),
        listings:
          body.listings === null || body.listings === undefined
            ? null
            : Number(body.listings),
        featured: Boolean(body.featured),
        ads:
          body.ads === null || body.ads === undefined ? null : Number(body.ads),
        adsduration:
          body.adsduration === null || body.adsduration === undefined
            ? null
            : Number(body.adsduration),
        maxFeaturedListings:
          body.maxFeaturedListings === null ||
          body.maxFeaturedListings === undefined
            ? null
            : Number(body.maxFeaturedListings),
        maxImagesPerListing:
          body.maxImagesPerListing === null ||
          body.maxImagesPerListing === undefined
            ? null
            : Number(body.maxImagesPerListing),
        maxVideosPerListing:
          body.maxVideosPerListing === null ||
          body.maxVideosPerListing === undefined
            ? null
            : Number(body.maxVideosPerListing),
      },
    });

    return NextResponse.json({ data: plan }, { status: 201 });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return jsonError("Plan ID already exists.", 409);
    }

    return jsonError("Failed to create plan.", 500);
  }
};

export const POST = withSubscription(createPlanHandler);
