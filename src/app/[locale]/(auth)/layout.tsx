import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import type { Locale } from "@/lib/locales";
import Link from "next/link";

export default async function AuthLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.10),transparent_35%),radial-gradient(circle_at_bottom_left,hsl(var(--secondary)/0.08),transparent_25%)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href={`/${locale}`}
          className="text-lg font-semibold tracking-tight"
        >
          Smssar
        </Link>
        <LanguageSwitcher currentLocale={locale} />
      </div>
      <main className="mx-auto flex min-h-[calc(100vh-88px)] max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
