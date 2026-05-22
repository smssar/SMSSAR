import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isLocale, locales } from "@/lib/locales";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return children;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const title = locale === "ar" ? "منصة تأجير المنازل" : "Smssar";

  return {
    title,
  };
}
