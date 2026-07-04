import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const product = await prisma.purchaseProduct.findUnique({
      where: {
        code: "EXTRA_LISTINGS",
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Purchase product EXTRA_LISTINGS not found.",
        },
        { status: 404 },
      );
    }

    const usersPro = await prisma.user.findMany({
      where: {
        planId: "plan_pro",
      },
      select: {
        id: true,
      },
    });

    await prisma.purchase.createMany({
      data: usersPro.map((user) => ({
        userId: user.id,
        purchaseProductId: product.id,
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        totalPriceSmmsar: 0,
        status: "ACTIVE",
        from: "BONUS",
      })),
    });

    const usersPremium = await prisma.user.findMany({
      where: {
        planId: "plan_premium",
      },
      select: {
        id: true,
      },
    });

    await prisma.purchase.createMany({
      data: usersPremium.map((user) => ({
        userId: user.id,
        purchaseProductId: product.id,
        quantity: 2,
        unitPrice: 0,
        totalPrice: 0,
        totalPriceSmmsar: 0,
        status: "ACTIVE",
        from: "BONUS",
      })),
    });

    return NextResponse.json({
      success: true,
      usersUpdated: usersPro.length + usersPremium.length,
      createdPurchases: usersPro.length + usersPremium.length,
      resetAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Monthly Pro listings cron failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to grant monthly listings.",
      },
      { status: 500 },
    );
  }
}
