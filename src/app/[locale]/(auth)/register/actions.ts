"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/api-utils";

export async function registerAction(formData: FormData, locale: string) {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();
  const roleValue = formData.get("role")?.toString();
  const phone = formData.get("phone")?.toString().trim();

  if (!email || !password) {
    redirect(`/${locale}/register?error=missing_fields`);
  }

  const requestHeaders = await headers();
  const baseUrl = getRequestBaseUrl(requestHeaders);

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
        phone,
        locale,
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

  redirect(`/${locale}/verify-email?email=${encodeURIComponent(email)}`);
}
