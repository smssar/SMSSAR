import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { defaultLocale, isLocale, locales, type Locale } from "@/lib/locales";
import {
  getUserRestriction,
  isExpiredSuspension,
} from "@/lib/user-restriction";
import { getActiveSubscription } from "@/lib/getActiveSubscription";

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
  const authRoutes = ["/login", "/register"];
  return authRoutes.some((route) => pathname.includes(`/${locale}${route}`));
}

function isRestrictionRoute(pathname: string, locale: Locale): boolean {
  return (
    pathname === `/${locale}/suspend` ||
    pathname.startsWith(`/${locale}/suspend/`)
  );
}

function isCheckPlanRoute(pathname: string, locale: Locale): boolean {
  return (
    pathname === `/${locale}/check-plan` ||
    pathname.startsWith(`/${locale}/check-plan/`)
  );
}

function isBecomeSellerRoute(pathname: string, locale: Locale): boolean {
  return (
    pathname === `/${locale}/become-seller` ||
    pathname.startsWith(`/${locale}/become-seller/`)
  );
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathnameHasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  const locale = detectLocale(request);
  const session = await auth();

  if (pathnameHasLocale) {
    if (session?.user?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          status: true,
          suspendedAt: true,
          suspendedUntil: true,
          suspendedMessage: true,
          suspendedBy: true,
          bannedMessage: true,
        },
      });

      if (dbUser) {
        // Check active subscription (handles expiration, free plan creation, planId sync)
        const activeSubscription = await getActiveSubscription(session.user.id);

        // If subscription is expired or none exists (and user isn't free plan), redirect to check-plan
        if (
          !activeSubscription &&
          !isCheckPlanRoute(pathname, locale) &&
          !isBecomeSellerRoute(pathname, locale)
        ) {
          return NextResponse.redirect(
            new URL(`/${locale}/check-plan`, request.url),
          );
        }

        // Handle suspension/restriction checks
        if (isExpiredSuspension(dbUser)) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: {
              status: "ACTIVE",
              suspendedAt: null,
              suspendedUntil: null,
              suspendedMessage: null,
              suspendedBy: null,
              bannedMessage: null,
            },
          });
        }

        const refreshedUser = isExpiredSuspension(dbUser)
          ? await prisma.user.findUnique({
              where: { id: dbUser.id },
              select: {
                status: true,
                suspendedUntil: true,
                suspendedMessage: true,
                bannedMessage: true,
              },
            })
          : dbUser;

        const restriction = refreshedUser
          ? getUserRestriction(refreshedUser)
          : null;

        if (restriction && !isRestrictionRoute(pathname, locale)) {
          return NextResponse.redirect(
            new URL(`/${locale}/suspend`, request.url),
          );
        }

        if (isRestrictionRoute(pathname, locale) && !restriction) {
          return NextResponse.redirect(
            new URL(`/${locale}/dashboard`, request.url),
          );
        }
      }
    }

    if (isProtectedRoute(pathname, locale) && !session) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

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
