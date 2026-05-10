import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashResetToken } from "@/lib/email-verification";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      email = "",
      token = "",
      password = "",
      confirmPassword = "",
      locale = "en",
    } = body;

    const toLower = (v: unknown) =>
      typeof v === "string" ? v.trim().toLowerCase() : "";
    const e = toLower(email);
    const t = typeof token === "string" ? token.trim() : "";

    if (!e || !t || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Invalid token or data" },
        { status: 400 },
      );
    }

    if (password.length < 8 || password !== confirmPassword) {
      return NextResponse.json(
        { error: "Password invalid or mismatch" },
        { status: 400 },
      );
    }

    const identifier = `reset:${e}`;
    const tokenHash = hashResetToken(t);

    const tokenRow = await prisma.verificationToken.findFirst({
      where: { identifier, token: tokenHash, expires: { gt: new Date() } },
    });

    if (!tokenRow) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 },
      );
    }

    const passwordHash = await hash(password, 12);
    await prisma.user.update({ where: { email: e }, data: { passwordHash } });
    await prisma.verificationToken.deleteMany({ where: { identifier } });

    return NextResponse.json({
      ok: true,
      redirect: `/${locale}/login?reset=1`,
    });
  } catch (err) {
    console.error("reset-password api error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
