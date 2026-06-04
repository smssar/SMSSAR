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

  const purchases = await prisma.purchase.findMany({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
    },
    include: {
      purchaseProduct: {
        select: {
          id: true,
          code: true,
          title: true,
          title_ar: true,
          title_fr: true,
          description: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ purchases });
}
