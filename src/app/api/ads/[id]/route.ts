import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, readJson } from "@/lib/api-utils";
import { AdStatus } from "@/generated/prisma/enums";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

type UpdateAdBody = {
  title?: string;
  description?: string | null;
  status?: AdStatus | string;
  featured?: boolean;
  startAt?: string | null;
  endAt?: string | null;
  pricePerDay?: number | null;
  budget?: number | null;
  featuredUntil?: string | null;
  planId?: string | null;
  propertyId?: string | null;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Authentication required.", 401);
  if (session.user.role !== "ADMIN") return jsonError("Only admins.", 403);

  const { id } = await context.params;
  const body = await readJson<UpdateAdBody>(request);
  if (!body) return jsonError("Invalid JSON body.");

  const existing = await prisma.ad.findUnique({ where: { id } });
  if (!existing) return jsonError("Ad not found.", 404);

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") data.title = body.title.trim();
  if (body.description !== undefined) data.description = body.description;
  if (body.status !== undefined) data.status = String(body.status) as AdStatus;
  if (body.featured !== undefined) data.featured = Boolean(body.featured);
  if (body.startAt !== undefined)
    data.startAt = body.startAt === null ? null : new Date(body.startAt);
  if (body.endAt !== undefined)
    data.endAt = body.endAt === null ? null : new Date(body.endAt);
  if (body.pricePerDay !== undefined)
    data.pricePerDay =
      body.pricePerDay === null ? null : Number(body.pricePerDay);
  if (body.budget !== undefined)
    data.budget = body.budget === null ? null : Number(body.budget);
  if (body.featuredUntil !== undefined)
    data.featuredUntil =
      body.featuredUntil === null ? null : new Date(body.featuredUntil);
  if (body.planId !== undefined)
    data.planId = body.planId === null ? null : String(body.planId);
  if (body.propertyId !== undefined)
    data.propertyId = body.propertyId === null ? null : String(body.propertyId);

  try {
    const ad = await prisma.ad.update({ where: { id }, data });
    return NextResponse.json({ data: ad });
  } catch (error: unknown) {
    console.error("Failed to update ad:", error);
    return jsonError("Failed to update ad.", 500);
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Authentication required.", 401);
  if (session.user.role !== "ADMIN") return jsonError("Only admins.", 403);

  const { id } = await context.params;

  try {
    await prisma.ad.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Failed to delete ad:", error);
    return jsonError("Failed to delete ad.", 500);
  }
}
