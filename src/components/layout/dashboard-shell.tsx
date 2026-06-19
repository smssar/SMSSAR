"use client";
import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  House,
  Menu,
  PanelLeftClose,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/locales";
import type { ReactNode } from "react";

const t = <T extends { en: string; ar: string; fr: string }>(
  locale: Locale,
  text: T,
) => text[locale] ?? text.en;

export interface DashboardNavItem {
  label: string;
  href: string;
  icon?: ReactNode;
}

export function DashboardShell({
  locale,
  title,
  roleLabel,
  items,
  children,
}: {
  locale: Locale;
  title: string;
  roleLabel: string;
  items: DashboardNavItem[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Overlay — blurs page content when mobile sidebar is open */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside
          className={cn(
            "border-border/60 bg-card/90 backdrop-blur-xl lg:border-r lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto",
            open ? "fixed inset-y-0 z-40 w-70" : "hidden lg:block",
          )}
        >
          <div className="flex h-full flex-col">
            {/* Sidebar header */}
            <div className="flex items-center justify-between border-b border-border/60 p-5">
              <Link
                href={`/${locale}`}
                className="flex items-center  font-semibold w-full"
                onClick={() => setOpen(false)}
              >
                <div className="grid h-10 w-40 place-items-center rounded-2xl ia-500 ">
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
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cursor-pointer lg:hidden"
              >
                <PanelLeftClose className="h-5 w-5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 space-y-1 p-4">
              {items.map((item, index) => {
                const isActive =
                  pathname === item.href ||
                  (index !== 0 && pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute inset-y-2 right-2 w-1 rounded-full bg-violet-500 transition-opacity",
                        isActive
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-60",
                      )}
                    />
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Sidebar footer */}
            <div className="border-t border-border/60 p-4">
              <Link
                href={`/${locale}`}
                onClick={() => setOpen(false)}
                className="mb-2 inline-flex h-11 w-full items-center justify-between gap-2 rounded-full border border-border bg-background px-5 text-sm font-medium transition-all hover:bg-muted/60"
              >
                <span className="flex items-center gap-2">
                  <House className="h-4 w-4" />
                  {t(locale, {
                    en: "Home",
                    ar: "الرئيسية",
                    fr: "Accueil",
                  })}
                </span>
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => {
                  setOpen(false);
                  void signOut({ callbackUrl: `/${locale}` });
                }}
              >
                <span className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />{" "}
                  {t(locale, {
                    en: "Logout",
                    ar: "تسجيل الخروج",
                    fr: "Déconnexion",
                  })}
                </span>
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setOpen((value) => !value)}
                  className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-border/70 bg-card shadow-sm lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <div className="text-lg font-semibold">{title}</div>
                  <div className="text-sm text-muted-foreground">
                    {roleLabel}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <LanguageSwitcher currentLocale={locale} />
                <Link
                  href={`/${locale}`}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-border bg-background px-3 text-sm font-medium transition-all hover:bg-muted/60"
                >
                  <House className="h-4 w-4" />
                  {t(locale, {
                    en: "Home",
                    ar: "الرئيسية",
                    fr: "Accueil",
                  })}
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void signOut({ callbackUrl: `/${locale}` })}
                >
                  <LogOut className="h-4 w-4" />
                  {t(locale, {
                    en: "Logout",
                    ar: "تسجيل الخروج",
                    fr: "Déconnexion",
                  })}
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
