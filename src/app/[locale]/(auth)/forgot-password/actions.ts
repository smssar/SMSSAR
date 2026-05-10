"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  generateResetToken,
  hashResetToken,
  sendResetPasswordEmail,
} from "@/lib/email-verification";
import { headers } from "next/headers";

function toStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function sendResetAction(formData: FormData, locale: string) {
  const email = toStringValue(formData.get("email")).toLowerCase();

  if (!email) {
    redirect(`/${locale}/forgot-password?sent=1`);
  }

  const requestHeaders = await headers();
  const forwardedProto = requestHeaders.get("x-forwarded-proto");
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = requestHeaders.get("host");
  const baseUrl =
    process.env.NEXTAUTH_URL ??
    (forwardedHost || host
      ? `${forwardedProto ?? "http"}://${forwardedHost ?? host}`
      : null);

  if (!baseUrl) {
    redirect(`/${locale}/forgot-password?sent=1`);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond as if sent to avoid account enumeration.
  if (!user) {
    redirect(`/${locale}/forgot-password?sent=1`);
  }

  const token = generateResetToken();
  const tokenHash = hashResetToken(token);

  const identifier = `reset:${email}`;

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: {
      identifier,
      token: tokenHash,
      expires: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
    },
  });

  await sendResetPasswordEmail(locale, email, token, baseUrl!);

  redirect(`/${locale}/forgot-password?sent=1`);
}
