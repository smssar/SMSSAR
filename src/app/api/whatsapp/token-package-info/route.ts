import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/whatsapp/token-package-info
 * Returns the current token package price and size
 */
export async function GET() {
  try {
    // Get a WhatsappUser to read default tokenPackagePrice and tokenPackageSize
    const defaultUser = await prisma.whatsappUser.findFirst({
      select: {
        tokenPackageSize: true,
        tokenPackagePrice: true,
      },
    });

    const tokenPackageSize = defaultUser?.tokenPackageSize || 10000;
    const tokenPackagePrice = defaultUser?.tokenPackagePrice || 500;

    return NextResponse.json({
      size: tokenPackageSize,
      price: tokenPackagePrice,
    });
  } catch (error) {
    console.error("Error fetching token package info:", error);
    return NextResponse.json(
      { error: "Failed to fetch token package info" },
      { status: 500 },
    );
  }
}
