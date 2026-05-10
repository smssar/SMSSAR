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
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside
          className={cn(
            "border-border/60 bg-card/90 backdrop-blur-xl lg:border-r lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto",
            open ? "fixed inset-y-0 z-40 w-70" : "hidden lg:block",
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border/60 p-5">
              <Link
                href={`/${locale}`}
                className="flex items-center gap-3 font-semibold"
              >
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-linear-to-br from-violet-600 to-fuchsia-500 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div>{title}</div>
                  <div className="text-xs text-muted-foreground">
                    {roleLabel}
                  </div>
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
            <nav className="flex-1 space-y-1 p-4">
              {items.map((item, index) => {
                const isActive =
                  pathname === item.href ||
                  (index !== 0 && pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
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
            <div className="border-t border-border/60 p-4">
              <Link
                href={`/${locale}`}
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
                onClick={() => void signOut({ callbackUrl: `/${locale}` })}
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
