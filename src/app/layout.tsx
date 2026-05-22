import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import { auth } from "@/auth";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { getDirection, isLocale, type Locale } from "@/lib/locales";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "../components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Smssar",
    template: "%s | Smssar",
  },
  description:
    "A premium multilingual Smssar for users, sellers, and administrators.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await auth();
  const requestHeaders = await headers();
  const headerLocale = requestHeaders.get("x-locale");
  const locale: Locale =
    headerLocale && isLocale(headerLocale) ? headerLocale : "en";
  const dir = getDirection(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head />
      <body
        className={`${inter.className} min-h-screen bg-background text-foreground antialiased transition-colors duration-200`}
      >
        <Providers session={session}>
          <ThemeToggle initialLocale={locale} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
