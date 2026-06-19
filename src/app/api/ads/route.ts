import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, readJson } from "@/lib/api-utils";
import { updateAdStatuses } from "@/lib/ad-utils";
import { AdStatus } from "@/generated/prisma/enums";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";

export const runtime = "nodejs";

type CreateAdBody = {
  locale?: string;
  propertyId: string;
  title: string;
  description?: string;
  startAt?: string; // ISO
  endAt?: string; // ISO
  budget?: number; // cents
  pricePerDay?: number; // cents
  featured?: boolean;
};

export async function POST(request: Request) {
  const session = await auth();
  const body = await readJson<CreateAdBody>(request);
  if (!body) return jsonError("Invalid JSON body.");

  const locale = (body.locale as Locale) ?? "en";
  const messages = getMessages(locale);
  const t = messages.dashboard.seller.adsPage;

  if (!session?.user?.id)
    return jsonError(t.authRequired ?? "Authentication required.", 401);
  if (session.user.role !== "SELLER" && session.user.role !== "SMSSAR")
    return jsonError(t.unauthorized ?? "Unauthorized.", 403);

  const {
    propertyId,
    title,
    description,
    startAt,
    endAt,
    budget,
    pricePerDay,
  } = body;

  if (!propertyId || !title)
    return jsonError(t.missingFields ?? "Missing required fields.", 400);

  if (!startAt)
    return jsonError(t.startAtRequired ?? "Start time is required.", 400);

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });
  if (!property)
    return jsonError(t.propertyNotFound ?? "Property not found.", 404);
  if (property.sellerId !== session.user.id)
    return jsonError(t.notOwner ?? "You do not own this property.", 403);

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const plan = user?.planId
    ? await prisma.plan.findUnique({ where: { id: user.planId } })
    : null;

  if (plan && typeof plan.ads === "number") {
    if (plan.ads === 0)
      return jsonError(t.noAdsAllowed ?? "Your plan does not allow ads.", 403);

    if (plan.ads > 0) {
      // Count ads for properties owned by this seller
      const activeCount = await prisma.ad.count({
        where: { property: { sellerId: session.user.id } },
      });
      if (activeCount >= plan.ads)
        return jsonError(
          t.maxAdsReached ??
            "You reached the maximum number of ads for your plan.",
          403,
        );
    }
  }

  // Parse dates
  const start = startAt ? new Date(startAt) : new Date();
  // Default to 30 days from start if not provided
  const end = endAt
    ? new Date(endAt)
    : new Date(
        start.getTime() + (plan?.adsduration || 2) * 24 * 60 * 60 * 1000,
      ); // Default to plan.adsduration days

  const status: AdStatus = start > new Date() ? "SCHEDULED" : "RUNNING";

  const createData = {
    title,
    description: description ?? null,
    userId: session.user.id,
    propertyId,
    planId: user?.planId ?? null,
    status,
    startAt: start,
    endAt: end,
    budget: typeof budget === "number" ? budget : null,
    pricePerDay: typeof pricePerDay === "number" ? pricePerDay : null,
  };

  const ad = await prisma.ad.create({ data: createData });

  return NextResponse.json({ data: ad });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Authentication required.", 401);

  // Update ad statuses based on current time
  await updateAdStatuses();

  const ads = await prisma.ad.findMany({
    where: { property: { sellerId: session.user.id } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data: ads });
}

export async function PATCH() {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Authentication required.", 401);
  if (session.user.role !== "ADMIN")
    return jsonError("Only admins can update ad statuses.", 403);

  try {
    await updateAdStatuses();
    return NextResponse.json({
      success: true,
      message: "Ad statuses updated successfully",
    });
  } catch (error) {
    console.error("Error updating ad statuses:", error);
    return jsonError("Failed to update ad statuses.", 500);
  }
}
