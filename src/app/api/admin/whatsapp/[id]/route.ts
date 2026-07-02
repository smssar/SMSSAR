import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, readJson } from "@/lib/api-utils";
import {
  resolveWhatsappAudioLimitReached,
  resolveWhatsappTokenLimitReached,
} from "@/lib/whatsapp-utils";

export const runtime = "nodejs";

type UpdateWhatsappUserBody = {
  tokensLimit?: number | null;
  audioLimit?: number | null;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Authentication required.", 401);
  if (session.user.role !== "ADMIN") {
    return jsonError("Only admins can update WhatsApp users.", 403);
  }

  const { id } = await params;
  if (!id) return jsonError("Whatsapp user id is required.", 400);

  const body = await readJson<UpdateWhatsappUserBody>(request);
  if (!body) return jsonError("Invalid JSON body.");

  if (body.tokensLimit !== undefined && body.tokensLimit !== null) {
    if (
      typeof body.tokensLimit !== "number" ||
      Number.isNaN(body.tokensLimit)
    ) {
      return jsonError("tokensLimit must be a number or null.", 400);
    }
    if (!Number.isInteger(body.tokensLimit) || body.tokensLimit < 0) {
      return jsonError("tokensLimit must be a positive integer or null.", 400);
    }
  }

  if (body.audioLimit !== undefined && body.audioLimit !== null) {
    if (typeof body.audioLimit !== "number" || Number.isNaN(body.audioLimit)) {
      return jsonError("audioLimit must be a number or null.", 400);
    }
    if (!Number.isInteger(body.audioLimit) || body.audioLimit < 0) {
      return jsonError("audioLimit must be a positive integer or null.", 400);
    }
  }

  try {
    const existing = await prisma.whatsappUser.findUnique({
      where: { id },
      select: {
        id: true,
        tokenUsage: true,
        tokensLimit: true,
        audioUsage: true,
        audioLimit: true,
      },
    });

    if (!existing) return jsonError("Whatsapp user not found.", 404);

    const nextTokensLimit =
      body.tokensLimit === undefined ? existing.tokensLimit : body.tokensLimit;
    const nextAudioLimit =
      body.audioLimit === undefined ? existing.audioLimit : body.audioLimit;

    const updated = await prisma.whatsappUser.update({
      where: { id },
      data: {
        tokensLimit:
          body.tokensLimit === undefined ? undefined : body.tokensLimit,
        tokenLimitReached: resolveWhatsappTokenLimitReached(
          existing.tokenUsage,
          nextTokensLimit,
        ),
        audioLimit: body.audioLimit === undefined ? undefined : body.audioLimit,
        audioLimitReached: resolveWhatsappAudioLimitReached(
          existing.audioUsage,
          nextAudioLimit,
        ),
      },
      select: {
        id: true,
        phoneNumber: true,
        name: true,
        language: true,
        totalMessages: true,
        tokenUsage: true,
        tokensLimit: true,
        tokenLimitReached: true,
        audioUsage: true,
        audioLimit: true,
        audioLimitReached: true,
        lastInteractionAt: true,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Failed to update whatsapp user:", error);
    return jsonError("Failed to update whatsapp user.", 500);
  }
}
