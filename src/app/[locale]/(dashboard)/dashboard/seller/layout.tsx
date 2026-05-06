import type { ReactNode } from "react";
import {
  BarChart3,
  FilePlus2,
  FolderHeart,
  MessageSquareText,
  Settings2,
  UserRound,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SellerDashboardLayout({
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

  if (session.user.role !== "SELLER") {
    if (session.user.role === "ADMIN") {
      redirect(`/${locale}/dashboard/admin`);
    }

    redirect(`/${locale}/dashboard/profile`);
  }

  const messages = getMessages(locale);

  const items = [
    {
      label: messages.dashboard.seller.overview,
      href: `/${locale}/dashboard/seller`,
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      label: messages.dashboard.seller.listings,
      href: `/${locale}/dashboard/seller/listings`,
      icon: <FolderHeart className="h-4 w-4" />,
    },
    {
      label: messages.dashboard.seller.addHouse,
      href: `/${locale}/dashboard/seller/add`,
      icon: <FilePlus2 className="h-4 w-4" />,
    },
    {
      label: messages.dashboard.seller.messages,
      href: `/${locale}/dashboard/seller/messages`,
      icon: <MessageSquareText className="h-4 w-4" />,
    },
    {
      label: messages.dashboard.seller.plan,
      href: `/${locale}/dashboard/seller/plan`,
      icon: <Settings2 className="h-4 w-4" />,
    },
    {
      label: messages.dashboard.seller.profile,
      href: `/${locale}/dashboard/seller/profile`,
      icon: <UserRound className="h-4 w-4" />,
    },
  ];

  return (
    <DashboardShell
      locale={locale}
      title={messages.dashboard.seller.title}
      roleLabel={locale === "ar" ? "حساب البائع" : "Seller account"}
      items={items}
    >
      {children}
    </DashboardShell>
  );
}
