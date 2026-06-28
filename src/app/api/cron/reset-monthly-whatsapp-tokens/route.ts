import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const result = await prisma.whatsappUser.updateMany({
      data: {
        monthlyUsageTokens: 0,
        tokenLimitReached: false,
      },
    });

    console.log(`Reset ${result.count} WhatsApp users.`);

    return NextResponse.json({
      success: true,
      updatedUsers: result.count,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
      },
      { status: 500 },
    );
  }
}
