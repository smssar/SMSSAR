"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  generateVerificationCode,
  hashVerificationCode,
  sendVerificationCodeEmail,
} from "@/lib/email-verification";

function toStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function verifyEmailAction(formData: FormData, locale: string) {
  const email = toStringValue(formData.get("email")).toLowerCase();
  const code = toStringValue(formData.get("code"));

  if (!email || !code) {
    redirect(
      `/${locale}/verify-email?email=${encodeURIComponent(email)}&error=missing_fields`,
    );
  }

  const token = await prisma.verificationToken.findFirst({
    where: {
      identifier: email,
      token: hashVerificationCode(code),
      expires: { gt: new Date() },
    },
  });

  if (!token) {
    redirect(
      `/${locale}/verify-email?email=${encodeURIComponent(email)}&error=invalid_code`,
    );
  }

  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  redirect(`/${locale}/login?verified=1`);
}

export async function resendVerificationAction(
  formData: FormData,
  locale: string,
) {
  const email = toStringValue(formData.get("email")).toLowerCase();

  if (!email) {
    redirect(`/${locale}/verify-email?error=missing_fields`);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { emailVerified: true },
  });

  if (!user) {
    redirect(`/${locale}/register?error=email_not_found`);
  }

  if (user.emailVerified) {
    redirect(`/${locale}/login?verified=1`);
  }

  const code = generateVerificationCode();
  const tokenHash = hashVerificationCode(code);

  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: tokenHash,
      expires: new Date(Date.now() + 1000 * 60 * 15),
    },
  });

  await sendVerificationCodeEmail(locale, email, code);

  redirect(`/${locale}/verify-email?email=${encodeURIComponent(email)}&sent=1`);
}
