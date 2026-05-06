"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

export async function registerAction(formData: FormData, locale: string) {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();
  const roleValue = formData.get("role")?.toString();

  if (!email || !password) {
    redirect(`/${locale}/register?error=missing_fields`);
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
    redirect(`/${locale}/register?error=server_error`);
  }

  try {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        name,
        email,
        password,
        confirmPassword,
        role: roleValue,
      }),
    });

    if (!response.ok) {
      let errorCode = "server_error";

      try {
        const payload = (await response.json()) as { error?: string };
        if (payload?.error) {
          errorCode = payload.error;
        }
      } catch {
        errorCode = "server_error";
      }

      redirect(`/${locale}/register?error=${errorCode}`);
    }
  } catch {
    redirect(`/${locale}/register?error=server_error`);
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: `/${locale}/dashboard`,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/${locale}/login?error=invalid_credentials`);
    }
    throw error;
  }
}
