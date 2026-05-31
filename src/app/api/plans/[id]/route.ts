import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, readJson } from "@/lib/api-utils";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type UpdatePlanBody = {
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

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const plan = await prisma.plan.findUnique({ where: { id } });

  if (!plan) {
    return jsonError("Plan not found.", 404);
  }

  return NextResponse.json({ data: plan });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return jsonError("Authentication required.", 401);
  }

  if (session.user.role !== "ADMIN") {
    return jsonError("Only admins can update plans.", 403);
  }

  const { id } = await context.params;
  const body = await readJson<UpdatePlanBody>(request);
  if (!body) {
    return jsonError("Invalid JSON body.");
  }

  const existing = await prisma.plan.findUnique({ where: { id } });
  if (!existing) {
    return jsonError("Plan not found.", 404);
  }

  const data: Record<string, unknown> = {};

  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.title_ar === "string")
    data.title_ar = body.title_ar.trim() || null;
  if (typeof body.title_fr === "string")
    data.title_fr = body.title_fr.trim() || null;
  if (typeof body.description === "string")
    data.description = body.description.trim();
  if (typeof body.description_ar === "string")
    data.description_ar = body.description_ar.trim() || null;
  if (typeof body.description_fr === "string")
    data.description_fr = body.description_fr.trim() || null;
  if (body.price !== undefined) data.price = Number(body.price);
  if (body.listings !== undefined)
    data.listings = body.listings === null ? null : Number(body.listings);
  if (body.featured !== undefined) data.featured = Boolean(body.featured);
  if (body.ads !== undefined)
    data.ads = body.ads === null ? null : Number(body.ads);
  if (body.adsduration !== undefined)
    data.adsduration =
      body.adsduration === null ? null : Number(body.adsduration);
  if (body.maxFeaturedListings !== undefined)
    data.maxFeaturedListings =
      body.maxFeaturedListings === null
        ? null
        : Number(body.maxFeaturedListings);
  if (body.maxImagesPerListing !== undefined)
    data.maxImagesPerListing =
      body.maxImagesPerListing === null
        ? null
        : Number(body.maxImagesPerListing);
  if (body.maxVideosPerListing !== undefined)
    data.maxVideosPerListing =
      body.maxVideosPerListing === null
        ? null
        : Number(body.maxVideosPerListing);

  try {
    const plan = await prisma.plan.update({
      where: { id },
      data,
    });

    return NextResponse.json({ data: plan });
  } catch (error: unknown) {
    console.error("Failed to update plan:", error);
    return jsonError("Failed to update plan.", 500);
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return jsonError("Authentication required.", 401);
  }

  if (session.user.role !== "ADMIN") {
    return jsonError("Only admins can delete plans.", 403);
  }

  const { id } = await context.params;

  const usedCount = await prisma.user.count({ where: { planId: id } });
  if (usedCount > 0) {
    return jsonError("Cannot delete a plan that is assigned to users.", 409);
  }

  try {
    await prisma.plan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Failed to delete plan:", error);
    return jsonError("Failed to delete plan.", 500);
  }
}
