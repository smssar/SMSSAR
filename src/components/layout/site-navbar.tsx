"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { LogOut, Menu, Search, ShieldCheck, Sparkles, X } from "lucide-react";
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
  const role = session?.user?.role;
  const showSellerLink = role === "SELLER";
  const showAdminLink = role === "ADMIN";
  const showUserProfileLink = role === "USER";
  const showAuthActions = !session?.user?.id;

  const links: Array<{ key: keyof Messages["nav"]; href: string }> = [
    { key: "properties", href: `/${locale}/properties` },
    { key: "pricing", href: `/${locale}/pricing` },
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

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-3 font-semibold tracking-tight"
        >
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-linear-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base">
              {t(locale, {
                en: "House Rental Platform",
                ar: "منصة تأجير العقارات",
                fr: "Plateforme de location",
              })}
            </div>
            <div className="text-xs text-muted-foreground">
              {t(locale, {
                en: "Premium marketplace",
                ar: "سوق مميز",
                fr: "Marketplace premium",
              })}
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex">
          {links.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className="rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              {messages.nav[key as keyof Messages["nav"]]}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          <LanguageSwitcher currentLocale={locale} />
          <ButtonLink
            href={`/${locale}/properties`}
            variant="outline"
            size="sm"
          >
            <Search className="h-4 w-4" />
            {messages.nav.properties}
          </ButtonLink>
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
          )}
        </div>

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
                className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted/70"
              >
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
                >
                  {messages.nav.login}
                </ButtonLink>
                <ButtonLink
                  href={`/${locale}/register`}
                  variant="accent"
                  size="md"
                >
                  {messages.nav.register}
                </ButtonLink>
              </>
            ) : (
              <ButtonLink
                href={`/${locale}`}
                variant="secondary"
                size="md"
                onClick={(event) => {
                  event.preventDefault();
                  void signOut({ callbackUrl: `/${locale}` });
                }}
              >
                <LogOut className="h-4 w-4" />
                {messages.nav.logout}
              </ButtonLink>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
