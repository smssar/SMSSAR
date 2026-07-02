import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get("email");
  const phone = searchParams.get("phone");

  try {
    const user = await prisma.whatsappUser.findFirst({
      where: {
        email: email || undefined,
        phoneNumber: phone ? decodeURIComponent(phone) : undefined,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user contact info:", error);
    return NextResponse.json(
      { error: "Failed to fetch user contact info." },
      { status: 500 },
    );
  }
}
