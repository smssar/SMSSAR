import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Locale } from "@/lib/locales";

export default async function DashboardPageEntry({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  if (session.user.role === "ADMIN") {
    redirect(`/${locale}/dashboard/admin`);
  }

  if (session.user.role === "SELLER") {
    redirect(`/${locale}/dashboard/seller`);
  }

  redirect(`/${locale}/dashboard/profile`);
}
