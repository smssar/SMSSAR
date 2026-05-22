import { prisma } from "@/lib/prisma";
import { generateResetToken, hashResetToken, sendResetPasswordEmail } from "@/lib/email-verification";
import { getRequestBaseUrl } from "@/lib/api-utils";
import { headers } from "next/headers";
import type { Locale } from "@/lib/locales";

export async function POST(request: Request) {
  try {
    const { email, locale } = (await request.json()) as {
      email: string;
      locale: Locale;
    };

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const requestHeaders = await headers();
    const baseUrl = getRequestBaseUrl(requestHeaders);

    if (!baseUrl) {
      return Response.json(
        { error: "Failed to determine base URL" },
        { status: 500 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond as if sent to avoid account enumeration
    if (!user) {
      return Response.json({ success: true }, { status: 200 });
    }

    const token = generateResetToken();
    const tokenHash = hashResetToken(token);
    const identifier = `reset:${email}`;

    await prisma.verificationToken.deleteMany({
      where: { identifier },
    });

    await prisma.verificationToken.create({
      data: {
        identifier,
        token: tokenHash,
        expires: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
      },
    });

    await sendResetPasswordEmail(locale, email, token, baseUrl);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Forgot password error:", error);
    return Response.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
