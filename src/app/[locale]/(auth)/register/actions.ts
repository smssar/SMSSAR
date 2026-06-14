"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/api-utils";
import { removeSpaces } from "@/lib/phone";

export async function registerAction(formData: FormData, locale: string) {
  console.log(formData);

  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();
  const roleValue = formData.get("role")?.toString();
  const phoneRaw = formData.get("phone")?.toString().trim();
  const countryDialCode = formData.get("countryDialCode")?.toString();
  const phone = removeSpaces(phoneRaw ?? "").replace(/^0+/, "");

  if (!email || !password) {
    const qs = new URLSearchParams();
    if (name) qs.set("name", name);
    if (email) qs.set("email", email);
    if (roleValue) qs.set("role", roleValue);
    if (phone) qs.set("phone", phone);
    qs.set("error", "missing_fields");

    redirect(`/${locale}/register?${qs.toString()}`);
  }

  const requestHeaders = await headers();
  const baseUrl =
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    getRequestBaseUrl(requestHeaders);

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
    const qs = new URLSearchParams();
    if (name) qs.set("name", name);
    if (email) qs.set("email", email);
    if (roleValue) qs.set("role", roleValue);
    if (phone) qs.set("phone", phone);
    qs.set("error", "server_error");

    redirect(`/${locale}/register?${qs.toString()}`);
  }

  if (!response.ok || result?.error) {
    const errorCode = result?.error ?? "server_error";
    const qs = new URLSearchParams();
    if (name) qs.set("name", name);
    if (email) qs.set("email", email);
    if (roleValue) qs.set("role", roleValue);
    if (phone) qs.set("phone", phone);
    qs.set("error", errorCode);

    redirect(`/${locale}/register?${qs.toString()}`);
  }

  redirect(`/${locale}/verify-email?email=${encodeURIComponent(email)}`);
}
