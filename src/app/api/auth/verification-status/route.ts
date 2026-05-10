import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "missing_email" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { emailVerified: true },
  });

  if (!user) {
    return NextResponse.json({ exists: false, verified: false });
  }

  return NextResponse.json({
    exists: true,
    verified: Boolean(user.emailVerified),
  });
}
