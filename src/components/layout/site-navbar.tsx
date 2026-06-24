"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import {
  ChevronDown,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/locales";
import type { Messages } from "@/lib/messages";

const t = <T extends { en: string; ar: string; fr: string }>(
  locale: Locale,
  text: T,
) => text[locale] ?? text.en;

export function SiteNavbar({
  locale,
  messages,
  session,
}: {
  locale: Locale;
  messages: Messages;
  session?: Session | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const role = session?.user?.role;

  const showSellerLink = role === "SELLER" || role === "SMSSAR";
  const showAdminLink = role === "ADMIN";
  const showUserProfileLink = role === "USER";
  const showAuthActions = !session?.user?.id;

  const manageHref =
    role === "SELLER" || role === "SMSSAR"
      ? `/${locale}/dashboard/seller/profile`
      : role === "ADMIN"
        ? `/${locale}/dashboard/admin`
        : `/${locale}/dashboard/profile`;

  const manageLabel =
    role === "SELLER" || role === "SMSSAR"
      ? messages.nav.seller
      : role === "ADMIN"
        ? messages.nav.admin
        : messages.nav.profile;

  const userName =
    session?.user?.name?.trim() || session?.user?.email || "User";
  const userEmail = session?.user?.email?.trim();

  const links: Array<{ key: keyof Messages["nav"]; href: string }> = [
    { key: "home", href: `/${locale}` },
    { key: "about", href: `/${locale}/about` },
    { key: "properties", href: `/${locale}/properties` },
    { key: "pricing", href: `/${locale}/pricing` },
    { key: "contact", href: `/${locale}/contact` },
  ];

  if (showSellerLink) {
    links.push({ key: "seller", href: `/${locale}/dashboard/seller` });
  }
  if (showAdminLink) {
    links.push({ key: "admin", href: `/${locale}/dashboard/admin` });
  }
  if (showUserProfileLink) {
    links.push({ key: "profile", href: `/${locale}/dashboard/profile` });
  }

  const isActiveLink = (href: string, key: keyof Messages["nav"]) =>
    key === "home"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Overlay — blurs page content when mobile menu is open */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm xl:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex  max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="flex items-center gap-3 font-semibold tracking-tight w-40 h-13"
            onClick={() => setOpen(false)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 425 90"
              role="img"
              aria-label="smasserIA"
            >
              <g transform="translate(0,12.5) scale(0.0686)">
                <g transform="translate(0,618.00) scale(1,-1)">
                  <path
                    fill="#7C3AED"
                    transform="translate(60.00,0)"
                    d="M32 183H201Q204 154 228.0 136.0Q252 118 287 118Q319 118 336.5 130.5Q354 143 354 163Q354 187 329.0 198.5Q304 210 248 224Q188 238 148.0 253.5Q108 269 79.0 302.5Q50 336 50 393Q50 441 76.5 480.5Q103 520 154.5 543.0Q206 566 277 566Q382 566 442.5 514.0Q503 462 512 376H354Q350 405 328.5 422.0Q307 439 272 439Q242 439 226.0 427.5Q210 416 210 396Q210 372 235.5 360.0Q261 348 315 336Q377 320 416.0 304.5Q455 289 484.5 254.5Q514 220 515 162Q515 113 487.5 74.5Q460 36 408.5 14.0Q357 -8 289 -8Q216 -8 159.0 17.0Q102 42 69.0 85.5Q36 129 32 183Z"
                  ></path>
                  <path
                    fill="#7C3AED"
                    transform="translate(618.00,0)"
                    d="M1001 326V0H831V303Q831 357 802.5 386.5Q774 416 724 416Q674 416 645.5 386.5Q617 357 617 303V0H447V303Q447 357 418.5 386.5Q390 416 340 416Q290 416 261.5 386.5Q233 357 233 303V0H62V558H233V488Q259 523 301.0 543.5Q343 564 396 564Q459 564 508.5 537.0Q558 510 586 460Q615 506 665.0 535.0Q715 564 774 564Q878 564 939.5 501.0Q1001 438 1001 326Z"
                  ></path>
                  <path
                    fill="#7C3AED"
                    transform="translate(1677.00,0)"
                    d="M274 566Q333 566 377.5 542.0Q422 518 446 479V558H617V0H446V79Q421 40 376.5 16.0Q332 -8 273 -8Q205 -8 149.0 27.5Q93 63 60.5 128.5Q28 194 28 280Q28 366 60.5 431.0Q93 496 149.0 531.0Q205 566 274 566ZM324 417Q273 417 237.5 380.5Q202 344 202 280Q202 216 237.5 178.5Q273 141 324 141Q375 141 410.5 178.0Q446 215 446 279Q446 343 410.5 380.0Q375 417 324 417Z"
                  ></path>
                  <path
                    fill="#7C3AED"
                    transform="translate(2356.00,0)"
                    d="M32 183H201Q204 154 228.0 136.0Q252 118 287 118Q319 118 336.5 130.5Q354 143 354 163Q354 187 329.0 198.5Q304 210 248 224Q188 238 148.0 253.5Q108 269 79.0 302.5Q50 336 50 393Q50 441 76.5 480.5Q103 520 154.5 543.0Q206 566 277 566Q382 566 442.5 514.0Q503 462 512 376H354Q350 405 328.5 422.0Q307 439 272 439Q242 439 226.0 427.5Q210 416 210 396Q210 372 235.5 360.0Q261 348 315 336Q377 320 416.0 304.5Q455 289 484.5 254.5Q514 220 515 162Q515 113 487.5 74.5Q460 36 408.5 14.0Q357 -8 289 -8Q216 -8 159.0 17.0Q102 42 69.0 85.5Q36 129 32 183Z"
                  ></path>
                  <path
                    fill="#7C3AED"
                    transform="translate(2914.00,0)"
                    d="M32 183H201Q204 154 228.0 136.0Q252 118 287 118Q319 118 336.5 130.5Q354 143 354 163Q354 187 329.0 198.5Q304 210 248 224Q188 238 148.0 253.5Q108 269 79.0 302.5Q50 336 50 393Q50 441 76.5 480.5Q103 520 154.5 543.0Q206 566 277 566Q382 566 442.5 514.0Q503 462 512 376H354Q350 405 328.5 422.0Q307 439 272 439Q242 439 226.0 427.5Q210 416 210 396Q210 372 235.5 360.0Q261 348 315 336Q377 320 416.0 304.5Q455 289 484.5 254.5Q514 220 515 162Q515 113 487.5 74.5Q460 36 408.5 14.0Q357 -8 289 -8Q216 -8 159.0 17.0Q102 42 69.0 85.5Q36 129 32 183Z"
                  ></path>
                  <path
                    fill="#7C3AED"
                    transform="translate(3472.00,0)"
                    d="M585 238H198Q202 186 231.5 158.5Q261 131 304 131Q368 131 393 185H575Q561 130 524.5 86.0Q488 42 433.0 17.0Q378 -8 310 -8Q228 -8 164.0 27.0Q100 62 64.0 127.0Q28 192 28 279Q28 366 63.5 431.0Q99 496 163.0 531.0Q227 566 310 566Q391 566 454.0 532.0Q517 498 552.5 435.0Q588 372 588 288Q588 264 585 238ZM413 333Q413 377 383.0 403.0Q353 429 308 429Q265 429 235.5 404.0Q206 379 199 333Z"
                  ></path>
                  <path
                    fill="#7C3AED"
                    transform="translate(4088.00,0)"
                    d="M408 564V383H361Q297 383 265.0 355.5Q233 328 233 259V0H62V558H233V465Q263 511 308.0 537.5Q353 564 408 564Z"
                  ></path>
                  <path
                    fill="#7C3AED"
                    transform="translate(4566.00,0) scale(1.4500)"
                    d="M233 702V0H62V702Z"
                  ></path>
                  <path
                    fill="#7C3AED"
                    transform="translate(4993.75,0) scale(1.4500)"
                    d="M499 124H237L195 0H16L270 702H468L722 0H541ZM455 256 368 513 282 256Z"
                  ></path>
                </g>
              </g>
            </svg>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 xl:flex">
            {links.map(({ key, href }) => (
              <Link
                key={key}
                href={href}
                aria-current={isActiveLink(href, key) ? "page" : undefined}
                className={cn(
                  "group relative rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 whitespace-nowrap",
                  isActiveLink(href, key)
                    ? "bg-linear-to-r from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "absolute inset-x-4 -bottom-0.5 h-px rounded-full bg-white/70 opacity-0 transition-opacity",
                    isActiveLink(href, key)
                      ? "opacity-100"
                      : "group-hover:opacity-60",
                  )}
                />
                {messages.nav[key as keyof Messages["nav"]]}
              </Link>
            ))}
          </nav>

          {/* Desktop auth */}
          <div className="hidden items-center gap-3 xl:flex">
            <LanguageSwitcher currentLocale={locale} />
            {showAuthActions ? (
              <>
                <ButtonLink
                  href={`/${locale}/login`}
                  variant="secondary"
                  size="sm"
                >
                  {messages.nav.login}
                </ButtonLink>
                <ButtonLink
                  href={`/${locale}/register`}
                  variant="accent"
                  size="sm"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {messages.nav.register}
                </ButtonLink>
              </>
            ) : (
              <details className="group relative">
                <summary className="list-none flex h-11 cursor-pointer items-center gap-3 rounded-full border border-border/70 bg-card px-3 pr-4 text-left shadow-sm transition hover:bg-muted/60">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-300">
                    {session?.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={userName}
                        width={32}
                        height={32}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound className="h-4 w-4" />
                    )}
                  </span>
                  <span className="hidden min-w-0 flex-col sm:flex">
                    <span className="max-w-32 truncate text-sm font-medium text-foreground">
                      {userName}
                    </span>
                    <span className="max-w-32 truncate text-xs text-muted-foreground">
                      {manageLabel}
                    </span>
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition group-open:rotate-180" />
                </summary>
                <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-80 rounded-3xl border border-border/70 bg-background p-4 shadow-2xl shadow-black/10 rtl:right-auto rtl:left-0">
                  <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-300">
                      {session?.user?.image ? (
                        <Image
                          src={session.user.image}
                          alt={userName}
                          width={48}
                          height={48}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserRound className="h-5 w-5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {userName}
                      </div>
                      {userEmail ? (
                        <div className="truncate text-xs text-muted-foreground">
                          {userEmail}
                        </div>
                      ) : null}
                      <div className="mt-1 text-xs font-medium text-violet-600 dark:text-violet-300">
                        {manageLabel}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2">
                    <ButtonLink href={manageHref} variant="accent" size="sm">
                      {manageLabel}
                    </ButtonLink>
                    <ButtonLink
                      href={`/${locale}`}
                      variant="secondary"
                      size="sm"
                      onClick={(event) => {
                        event.preventDefault();
                        void signOut({ callbackUrl: `/${locale}` });
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      {messages.nav.logout}
                    </ButtonLink>
                  </div>
                </div>
              </details>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex items-center gap-2 xl:hidden">
            <LanguageSwitcher currentLocale={locale} />
            <button
              type="button"
              className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-border/70 bg-card shadow-sm"
              onClick={() => setOpen((value) => !value)}
              aria-label={t(locale, {
                en: "Toggle menu",
                ar: "تبديل القائمة",
                fr: "Basculer le menu",
              })}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={cn(
            "border-t border-border/50 px-4 pb-4 sm:px-6 lg:px-8 xl:hidden",
            open ? "block" : "hidden",
          )}
        >
          <div className="mx-auto max-w-7xl space-y-4 pt-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {links.map(({ key, href }) => (
                <Link
                  key={key}
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={isActiveLink(href, key) ? "page" : undefined}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-300 whitespace-nowrap",
                    isActiveLink(href, key)
                      ? "border-violet-500/30 bg-linear-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20"
                      : "border-border/70 bg-card text-foreground hover:border-violet-500/30 hover:bg-muted/70 hover:shadow-sm",
                  )}
                >
                  <span
                    className={cn(
                      "absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-violet-200 transition-opacity rtl:right-auto rtl:left-3",
                      isActiveLink(href, key)
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-60",
                    )}
                  />
                  {messages.nav[key]}
                </Link>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {showAuthActions ? (
                <>
                  <ButtonLink
                    href={`/${locale}/login`}
                    variant="secondary"
                    size="md"
                    onClick={() => setOpen(false)}
                  >
                    {messages.nav.login}
                  </ButtonLink>
                  <ButtonLink
                    href={`/${locale}/register`}
                    variant="accent"
                    size="md"
                    onClick={() => setOpen(false)}
                  >
                    {messages.nav.register}
                  </ButtonLink>
                </>
              ) : (
                <div className="space-y-3 sm:col-span-2">
                  <div className="flex items-center gap-3 rounded-3xl border border-border/70 bg-card p-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-300">
                      {session?.user?.image ? (
                        <Image
                          src={session.user.image}
                          alt={userName}
                          width={48}
                          height={48}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserRound className="h-5 w-5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {userName}
                      </div>
                      {userEmail ? (
                        <div className="truncate text-xs text-muted-foreground">
                          {userEmail}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <ButtonLink
                    href={manageHref}
                    variant="accent"
                    size="md"
                    onClick={() => setOpen(false)}
                  >
                    {manageLabel}
                  </ButtonLink>
                  <ButtonLink
                    href={`/${locale}`}
                    variant="secondary"
                    size="md"
                    onClick={(event) => {
                      event.preventDefault();
                      setOpen(false);
                      void signOut({ callbackUrl: `/${locale}` });
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    {messages.nav.logout}
                  </ButtonLink>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
