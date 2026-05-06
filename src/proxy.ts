import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, isLocale, locales, type Locale } from "@/lib/locales";
import { auth } from "@/auth";

function detectLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get("locale")?.value;

  if (isLocale(cookieLocale ?? "")) {
    return cookieLocale as Locale;
  }

  const preferred = request.headers
    .get("accept-language")
    ?.split(",")
    .map((segment) => segment.trim().slice(0, 2))
    .find((segment) => isLocale(segment));

  return preferred ?? defaultLocale;
}

function isProtectedRoute(pathname: string, locale: Locale): boolean {
  return pathname.includes(`/${locale}/dashboard`);
}

function isAuthRoute(pathname: string, locale: Locale): boolean {
  const authRoutes = ["/login", "/register", "/forgot-password"];
  return authRoutes.some((route) => pathname.includes(`/${locale}${route}`));
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathnameHasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  const locale = detectLocale(request);

  // Check authentication for protected routes
  const session = await auth();

  if (pathnameHasLocale) {
    // Check if trying to access protected route without session
    if (isProtectedRoute(pathname, locale) && !session) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    // Check if authenticated user trying to access auth routes
    if (isAuthRoute(pathname, locale) && session) {
      return NextResponse.redirect(
        new URL(`/${locale}/dashboard`, request.url),
      );
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(
      "x-locale",
      pathnameHasLocale ? pathname.split("/")[1] : locale,
    );

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    response.cookies.set(
      "locale",
      requestHeaders.get("x-locale") ?? defaultLocale,
      {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      },
    );
    return response;
  }

  // Check auth before redirecting to localized path
  const newPathname = `/${locale}${pathname === "/" ? "" : pathname}`;

  if (isProtectedRoute(newPathname, locale) && !session) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  if (isAuthRoute(newPathname, locale) && session) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  const response = NextResponse.redirect(new URL(newPathname, request.url));
  response.cookies.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
