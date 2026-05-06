import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Locale } from "@/lib/locales";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  return children;
}
