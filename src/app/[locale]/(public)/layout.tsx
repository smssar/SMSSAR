import type { ReactNode } from "react";
import { auth } from "@/auth";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNavbar } from "@/components/layout/site-navbar";

export default async function PublicLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const messages = getMessages(locale);
  const session = await auth();

  return (
    <div className="min-h-screen bg-background">
      <SiteNavbar locale={locale} messages={messages} session={session} />
      <main>{children}</main>
      <SiteFooter locale={locale} messages={messages} />
    </div>
  );
}
