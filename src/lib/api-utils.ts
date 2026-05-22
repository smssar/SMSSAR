import { NextResponse } from "next/server";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
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
