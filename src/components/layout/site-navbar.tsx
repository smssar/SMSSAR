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
  Sparkles,
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
  const showSellerLink = role === "SELLER";
  const showAdminLink = role === "ADMIN";
  const showUserProfileLink = role === "USER";
  const showAuthActions = !session?.user?.id;
  const manageHref =
    role === "SELLER"
      ? `/${locale}/dashboard/seller/profile`
      : role === "ADMIN"
        ? `/${locale}/dashboard/admin`
        : `/${locale}/dashboard/profile`;
  const manageLabel =
    role === "SELLER"
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
                en: "Smssar",
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
              aria-current={isActiveLink(href, key) ? "page" : undefined}
              className={cn(
                "group relative rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
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
                    {role === "SELLER"
                      ? messages.nav.seller
                      : role === "ADMIN"
                        ? messages.nav.admin
                        : messages.nav.profile}
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
                      {role === "SELLER"
                        ? messages.nav.seller
                        : role === "ADMIN"
                          ? messages.nav.admin
                          : messages.nav.profile}
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
                aria-current={isActiveLink(href, key) ? "page" : undefined}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-300",
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

                <ButtonLink href={manageHref} variant="accent" size="md">
                  {manageLabel}
                </ButtonLink>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
