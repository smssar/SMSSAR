import type { ReactNode } from "react";
import {
  BarChart3,
  FilePlus2,
  FolderHeart,
  Heart,
  CreditCard,
  Settings2,
  UserRound,
  ShoppingBag,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SmssarDashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  if (session.user.role !== "SELLER" && session.user.role !== "SMSSAR") {
    if (session.user.role === "ADMIN") {
      redirect(`/${locale}/dashboard/admin`);
    }

    redirect(`/${locale}/dashboard/profile`);
  }

  const messages = getMessages(locale);

  const items = [
    {
      label: messages.dashboard.seller.overview,
      href: `/${locale}/dashboard/smssar`,
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      label: messages.dashboard.seller.listings,
      href: `/${locale}/dashboard/smssar/listings`,
      icon: <FolderHeart className="h-4 w-4" />,
    },
    {
      label: messages.dashboard.seller.addHouse,
      href: `/${locale}/dashboard/smssar/add`,
      icon: <FilePlus2 className="h-4 w-4" />,
    },
    {
      label: messages.dashboard.seller.subscriptions,
      href: `/${locale}/dashboard/smssar/subscriptions`,
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      label: messages.dashboard.seller.billing ?? "Billing",
      href: `/${locale}/dashboard/smssar/billing`,
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      label: messages.dashboard.seller.plan,
      href: `/${locale}/dashboard/smssar/plan`,
      icon: <Settings2 className="h-4 w-4" />,
    },
    {
      label: locale === "ar" ? "الشراء" : "Purchases",
      href: `/${locale}/dashboard/smssar/purchases`,
      icon: <ShoppingBag className="h-4 w-4" />,
    },
    {
      label: messages.dashboard.seller.profile,
      href: `/${locale}/dashboard/smssar/profile`,
      icon: <UserRound className="h-4 w-4" />,
    },
    {
      label: messages.nav.favorites,
      href: `/${locale}/dashboard/smssar/favorites`,
      icon: <Heart className="h-4 w-4" />,
    },
  ];

  return (
    <DashboardShell
      locale={locale}
      title={messages.dashboard.seller.title}
      roleLabel={locale === "ar" ? "حساب Smssar" : "Smssar account"}
      items={items}
    >
      {children}
    </DashboardShell>
  );
}
