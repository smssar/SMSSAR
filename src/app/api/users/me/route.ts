import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLocaleFromHeaders, jsonError, readJson } from "@/lib/api-utils";
import { validateAndNormalizePhone } from "@/lib/phone";

export async function PATCH(request: Request) {
  const locale = getLocaleFromHeaders(request.headers as Headers);

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return jsonError({ key: "errors.authRequired", locale }, 401);
  }

  const body = await readJson<Record<string, unknown>>(request);
  if (!body) {
    return jsonError({ key: "errors.invalidJson", locale }, 400);
  }

  const updateData: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    updateData.name = body.name.trim();
  }

  if (typeof body.phone === "string") {
    const phoneResult = validateAndNormalizePhone(body.phone as string);
    if (!phoneResult.valid) {
      return jsonError({ key: "errors.invalidPhone", locale }, 400);
    }

    const existing = await prisma.user.findFirst({
      where: { phone: phoneResult.e164, NOT: { id: userId } },
      select: { id: true },
    });

    if (existing) {
      return jsonError({ key: "errors.phoneTaken", locale }, 400);
    }

    updateData.phone = phoneResult.e164;
  }

  if (typeof body.bio === "string") {
    updateData.bio = body.bio.trim();
  }
  if (typeof body.city === "string") {
    updateData.city = body.city.trim();
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        bio: true,
        city: true,
      },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch {
    // Fallback error
    return jsonError({ key: "errors.invalidJson", locale }, 500);
  }
}
