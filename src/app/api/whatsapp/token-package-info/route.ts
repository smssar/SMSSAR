import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/whatsapp/token-package-info
 * Returns the current WhatsApp token and audio package pricing
 */
export async function GET() {
  try {
    // Get a WhatsappUser to read default token package values.
    const defaultUser = await prisma.whatsappUser.findFirst({
      select: {
        tokenPackageSize: true,
        tokenPackagePrice: true,
      },
    });

    const tokenPackageSize = defaultUser?.tokenPackageSize || 30000;
    const tokenPackagePrice = defaultUser?.tokenPackagePrice || 500;
    const audioPackageSize = Number(
      process.env.WHATSAPP_AUDIO_PACKAGE_SIZE || 40,
    );
    const audioPackagePrice = Number(
      process.env.WHATSAPP_AUDIO_PACKAGE_PRICE || 80,
    );

    return NextResponse.json({
      tokens: {
        size: tokenPackageSize,
        price: tokenPackagePrice,
        type: "tokens",
      },
      audio: {
        size: audioPackageSize,
        price: audioPackagePrice,
        type: "audio",
      },
    });
  } catch (error) {
    console.error("Error fetching token package info:", error);
    return NextResponse.json(
      { error: "Failed to fetch token package info" },
      { status: 500 },
    );
  }
}
