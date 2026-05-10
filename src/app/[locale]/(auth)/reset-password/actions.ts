"use server";

import { redirect } from "next/navigation";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashResetToken } from "@/lib/email-verification";

function toStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function resetPasswordAction(formData: FormData, locale: string) {
  const email = toStringValue(formData.get("email")).toLowerCase();
  const token = toStringValue(formData.get("token"));
  const password = toStringValue(formData.get("password"));
  const confirmPassword = toStringValue(formData.get("confirmPassword"));

  if (!email || !token || !password || !confirmPassword) {
    redirect(
      `/${locale}/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}&error=invalid_token`,
    );
  }

  if (password.length < 8 || password !== confirmPassword) {
    redirect(
      `/${locale}/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}&error=invalid_token`,
    );
  }

  const identifier = `reset:${email}`;

  const tokenHash = hashResetToken(token);

  const tokenRow = await prisma.verificationToken.findFirst({
    where: {
      identifier,
      token: tokenHash,
      expires: { gt: new Date() },
    },
  });

  if (!tokenRow) {
    redirect(
      `/${locale}/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}&error=invalid_token`,
    );
  }

  const passwordHash = await hash(password, 12);

  await prisma.user.update({ where: { email }, data: { passwordHash } });

  await prisma.verificationToken.deleteMany({ where: { identifier } });

  redirect(`/${locale}/login?reset=1`);
}
