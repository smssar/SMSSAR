import { NextResponse } from "next/server";
import { messages } from "./messages";
import { defaultLocale, isLocale, type Locale } from "./locales";

function resolveMessage(keyPath: string, locale: Locale): string {
  const parts = keyPath.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = (messages as any)[locale];
  for (const p of parts) {
    if (!current) return keyPath;
    current = current[p];
  }
  return typeof current === "string" ? current : keyPath;
}

export function getLocaleFromHeaders(headers?: Headers): Locale {
  try {
    const header = headers?.get("x-locale") || headers?.get("x-local") || "";
    if (header && isLocale(header)) return header as Locale;

    const accept = headers?.get("accept-language") || "";
    if (accept) {
      const first = accept.split(",")[0].split("-")[0];
      if (isLocale(first)) return first as Locale;
    }
  } catch {
    // fallthrough
  }

  return defaultLocale;
}

export function jsonError(
  messageOrKey: string | { key: string; locale?: Locale },
  status = 400,
) {
  if (typeof messageOrKey === "string") {
    return NextResponse.json({ error: messageOrKey }, { status });
  }

  const locale = messageOrKey.locale ?? defaultLocale;
  const msg = resolveMessage(
    messageOrKey.key,
    isLocale(locale) ? locale : defaultLocale,
  );
  return NextResponse.json({ error: msg }, { status });
}

export function jsonFieldErrors(
  fieldErrors: Record<string, string | undefined>,
  message?: string,
  status = 400,
) {
  return NextResponse.json({ error: message, fieldErrors }, { status });
}

export function getRequestBaseUrl(headers?: Headers): string | null {
  const forwardedProto = headers?.get("x-forwarded-proto")?.trim();
  const forwardedHost = headers?.get("x-forwarded-host")?.trim();
  const host = headers?.get("host")?.trim();

  const rawBaseUrl =
    process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? null;

  const candidate = forwardedHost || host || rawBaseUrl;

  if (!candidate) {
    return null;
  }

  try {
    const url = candidate.startsWith("http")
      ? new URL(candidate)
      : new URL(`${forwardedProto ?? "https"}://${candidate}`);

    return url.origin;
  } catch {
    return candidate.replace(/\/+$/, "");
  }
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
