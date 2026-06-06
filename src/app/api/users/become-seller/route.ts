import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, readJson, getLocaleFromHeaders } from "@/lib/api-utils";
import { ensureFreePlan } from "@/lib/ensure-free-plan";
import { validateAndNormalizePhone } from "@/lib/phone";

type BecomeSellerBody = {
  phone?: string;
};

export async function POST(request: Request) {
  const locale = getLocaleFromHeaders(request.headers);
  const session = await auth();

  if (!session?.user?.id) {
    return jsonError({ key: "errors.authRequired", locale }, 401);
  }

  if (session.user.role === "ADMIN") {
    return jsonError({ key: "errors.adminCannotBecomeSeller", locale }, 403);
  }

  const body = await readJson<BecomeSellerBody>(request);
  if (!body) {
    return jsonError({ key: "errors.invalidJson", locale }, 400);
  }

  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const phoneValidation = validateAndNormalizePhone(phone);

  if (!phoneValidation.valid) {
    return jsonError({ key: "errors.invalidPhone", locale }, 400);
  }

  await ensureFreePlan();

  const isExistingSellerPhone = await prisma.user.findFirst({
    where: {
      phone: phoneValidation.e164,
      role: "SELLER",
      id: { not: session.user.id },
    },
  });

  if (isExistingSellerPhone) {
    return jsonError({ key: "errors.phoneTaken", locale }, 400);
  }

  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      role: "SELLER",
      phone: phoneValidation.e164,
      planId: session.user.planId ?? "plan_free",
    },
    select: {
      id: true,
      role: true,
      phone: true,
    },
  });

  return NextResponse.json({ data: updatedUser });
}
