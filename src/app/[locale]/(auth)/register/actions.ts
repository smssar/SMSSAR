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

  let response: Response;
  let result: { error?: string };

  try {
    response = await fetch(`${baseUrl}/api/auth/register`, {
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

    result = await response.json();
  } catch {
    redirect(`/${locale}/register?error=server_error`);
  }

  if (!response.ok || result?.error) {
    const errorCode = result?.error ?? "server_error";

    redirect(`/${locale}/register?error=${encodeURIComponent(errorCode)}`);
  }

  redirect(`/${locale}/verify-email?email=${encodeURIComponent(email)}`);
}
