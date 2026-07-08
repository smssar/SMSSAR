"use client";
import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ChevronLeft, House, Menu, PanelLeftClose, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/locales";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "../language-switcher";

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
                className="flex items-center h-10 font-semibold w-full"
                onClick={() => setOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  width="512"
                  height="512"
                  role="img"
                  aria-label="smssar"
                >
                  <g transform="translate(73.02,284.96) scale(0.3549)">
                    <path
                      d="M80.40 3.60L80.40 3.60Q54.30 3.60 34.95-8.85Q15.60-21.30 8.40-42.60L8.40-42.60L37.80-56.70Q44.10-42.90 55.35-35.10Q66.60-27.30 80.40-27.30L80.40-27.30Q90.90-27.30 97.35-31.95Q103.80-36.60 103.80-44.70L103.80-44.70Q103.80-51.90 98.25-55.80Q92.70-59.70 84.90-61.80L84.90-61.80L58.20-69.30Q37.50-75 26.85-87.45Q16.20-99.90 16.20-116.70L16.20-116.70Q16.20-131.70 24-142.95Q31.80-154.20 45.30-160.50Q58.80-166.80 76.50-166.80L76.50-166.80Q99.60-166.80 117.30-155.55Q135-144.30 142.50-124.50L142.50-124.50L112.50-110.40Q108.30-121.50 98.40-128.10Q88.50-134.70 76.20-134.70L76.20-134.70Q66.30-134.70 60.60-130.20Q54.90-125.70 54.90-118.50L54.90-118.50Q54.90-111.60 60.15-107.70Q65.40-103.80 74.10-101.40L74.10-101.40L100.20-93.60Q120.30-87.60 131.25-75.45Q142.20-63.30 142.20-46.20L142.20-46.20Q142.20-31.20 134.40-20.10Q126.60-9 112.65-2.70Q98.70 3.60 80.40 3.60ZM211.80 0L172.50 0L172.50-163.20L209.40-163.20L209.40-142.80Q216-154.80 228-160.80Q240-166.80 255-166.50L255-166.50Q271.50-166.80 284.85-159.60Q298.20-152.40 305.40-140.40L305.40-140.40Q313.80-153.60 326.85-160.20Q339.90-166.80 356.10-166.80L356.10-166.80Q373.50-166.80 387.15-158.85Q400.80-150.90 408.60-137.10Q416.40-123.30 416.40-105L416.40-105L416.40 0L377.10 0L377.10-95.70Q377.10-111.90 368.55-121.35Q360-130.80 345.60-130.80L345.60-130.80Q331.50-130.80 322.80-121.20Q314.10-111.60 314.10-95.70L314.10-95.70L314.10 0L274.80 0L274.80-95.70Q274.80-111.90 266.25-121.35Q257.70-130.80 243.30-130.80L243.30-130.80Q228.90-130.80 220.35-121.20Q211.80-111.60 211.80-95.70L211.80-95.70L211.80 0ZM511.80 3.60L511.80 3.60Q485.70 3.60 466.35-8.85Q447-21.30 439.80-42.60L439.80-42.60L469.20-56.70Q475.50-42.90 486.75-35.10Q498-27.30 511.80-27.30L511.80-27.30Q522.30-27.30 528.75-31.95Q535.20-36.60 535.20-44.70L535.20-44.70Q535.20-51.90 529.65-55.80Q524.10-59.70 516.30-61.80L516.30-61.80L489.60-69.30Q468.90-75 458.25-87.45Q447.60-99.90 447.60-116.70L447.60-116.70Q447.60-131.70 455.40-142.95Q463.20-154.20 476.70-160.50Q490.20-166.80 507.90-166.80L507.90-166.80Q531-166.80 548.70-155.55Q566.40-144.30 573.90-124.50L573.90-124.50L543.90-110.40Q539.70-121.50 529.80-128.10Q519.90-134.70 507.60-134.70L507.60-134.70Q497.70-134.70 492-130.20Q486.30-125.70 486.30-118.50L486.30-118.50Q486.30-111.60 491.55-107.70Q496.80-103.80 505.50-101.40L505.50-101.40L531.60-93.60Q551.70-87.60 562.65-75.45Q573.60-63.30 573.60-46.20L573.60-46.20Q573.60-31.20 565.80-20.10Q558-9 544.05-2.70Q530.10 3.60 511.80 3.60ZM666.00 3.60L666.00 3.60Q639.90 3.60 620.55-8.85Q601.20-21.30 594.00-42.60L594.00-42.60L623.40-56.70Q629.70-42.90 640.95-35.10Q652.20-27.30 666.00-27.30L666.00-27.30Q676.50-27.30 682.95-31.95Q689.40-36.60 689.40-44.70L689.40-44.70Q689.40-51.90 683.85-55.80Q678.30-59.70 670.50-61.80L670.50-61.80L643.80-69.30Q623.10-75 612.45-87.45Q601.80-99.90 601.80-116.70L601.80-116.70Q601.80-131.70 609.60-142.95Q617.40-154.20 630.90-160.50Q644.40-166.80 662.10-166.80L662.10-166.80Q685.20-166.80 702.90-155.55Q720.60-144.30 728.10-124.50L728.10-124.50L698.10-110.40Q693.90-121.50 684.00-128.10Q674.10-134.70 661.80-134.70L661.80-134.70Q651.90-134.70 646.20-130.20Q640.50-125.70 640.50-118.50L640.50-118.50Q640.50-111.60 645.75-107.70Q651.00-103.80 659.70-101.40L659.70-101.40L685.80-93.60Q705.90-87.60 716.85-75.45Q727.80-63.30 727.80-46.20L727.80-46.20Q727.80-31.20 720.00-20.10Q712.20-9 698.25-2.70Q684.30 3.60 666.00 3.60ZM807.60 3.60L807.60 3.60Q782.10 3.60 766.80-9Q751.50-21.60 751.50-43.20L751.50-43.20Q751.50-63.60 765.30-77.10Q779.10-90.60 807.90-95.40L807.90-95.40L856.50-103.20L856.50-108.60Q856.50-119.10 848.25-126.15Q840-133.20 826.50-133.20L826.50-133.20Q813.60-133.20 804-126.45Q794.40-119.70 789.90-108.60L789.90-108.60L757.80-124.20Q765-143.40 784.20-155.10Q803.40-166.80 828-166.80L828-166.80Q848.10-166.80 863.25-159.30Q878.40-151.80 887.10-138.75Q895.80-125.70 895.80-108.60L895.80-108.60L895.80 0L858.60 0L858.60-17.10Q839.40 3.60 807.60 3.60ZM792.30-44.70L792.30-44.70Q792.30-36.30 798.60-31.35Q804.90-26.40 814.80-26.40L814.80-26.40Q833.40-26.40 844.95-37.95Q856.50-49.50 856.50-66.60L856.50-66.60L856.50-73.20L815.40-66.30Q792.30-62.10 792.30-44.70ZM971.40 0L932.10 0L932.10-163.20L969-163.20L969-140.40Q975.30-153.90 986.70-159.45Q998.10-165 1013.10-165L1013.10-165L1022.70-165L1022.70-130.20L1008.60-130.20Q992.10-130.20 981.75-119.85Q971.40-109.50 971.40-90.90L971.40-90.90L971.40 0Z"
                      fill="#7C3AED"
                    ></path>
                  </g>
                </svg>
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
