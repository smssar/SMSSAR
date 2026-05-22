import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, readJson } from "@/lib/api-utils";
import { ensureFreePlan } from "@/lib/ensure-free-plan";

type BecomeSellerBody = {
  phone?: string;
};

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return jsonError("Authentication required.", 401);
  }

  if (session.user.role === "ADMIN") {
    return jsonError("Admins cannot be converted to seller.", 403);
  }

  const body = await readJson<BecomeSellerBody>(request);
  if (!body) {
    return jsonError("Invalid JSON body.", 400);
  }

  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (phone.length < 6) {
    return jsonError("Please enter a valid phone number.", 400);
  }

  await ensureFreePlan();

  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      role: "SELLER",
      phone,
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
