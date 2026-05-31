import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api-utils";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return jsonError("Authentication required.", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      planId: true,
    },
  });

  if (!user) {
    return jsonError("User not found.", 404);
  }

  if (!user.planId) {
    return NextResponse.json({
      plan: null,
    });
  }

  const plan = await prisma.plan.findUnique({
    where: { id: user.planId },
    select: {
      id: true,
      title: true,
      adsduration: true,
      ads: true,
    },
  });

  return NextResponse.json({
    plan,
  });
}
