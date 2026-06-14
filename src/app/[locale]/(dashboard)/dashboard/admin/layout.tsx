import type { ReactNode } from "react";
import {
  BarChart3,
  MapPinned,
  FileBadge2,
  ListChecks,
  Heart,
  Tags,
  Users,
  Settings2,
  UserCircle2,
  Undo2,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminDashboardLayout({
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

  if (session.user.role !== "ADMIN") {
    if (session.user.role === "SELLER") {
      redirect(`/${locale}/dashboard/seller`);
    }

    redirect(`/${locale}/dashboard/profile`);
  }

  const messages = getMessages(locale);

  const items = [
    {
      label: messages.dashboard.admin.overview,
      href: `/${locale}/dashboard/admin`,
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      label: messages.dashboard.admin.users,
      href: `/${locale}/dashboard/admin/users`,
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: messages.dashboard.admin.listings,
      href: `/${locale}/dashboard/admin/listings`,
      icon: <ListChecks className="h-4 w-4" />,
    },
    {
      label:
        locale === "ar"
          ? "أنواع العقارات"
          : locale === "fr"
            ? "Types de propriétés"
            : "Property Types",
      href: `/${locale}/dashboard/admin/property-types`,
      icon: <Tags className="h-4 w-4" />,
    },
    {
      label: messages.dashboard.admin.cities,
      href: `/${locale}/dashboard/admin/cities`,
      icon: <MapPinned className="h-4 w-4" />,
    },
    {
      label: messages.dashboard.admin.pagesManagement,
      href: `/${locale}/dashboard/admin/pages`,
      icon: <FileBadge2 className="h-4 w-4" />,
    },
    {
      label: messages.dashboard.admin.plans,
      href: `/${locale}/dashboard/admin/plans`,
      icon: <Settings2 className="h-4 w-4" />,
    },
    {
      label: messages.dashboard.admin.reports,
      href: `/${locale}/dashboard/admin/reports`,
      icon: <FileBadge2 className="h-4 w-4" />,
    },
    {
      label:
        locale === "ar"
          ? "المبالغ المسترجعة"
          : locale === "fr"
            ? "Remboursements"
            : "Refunds",
      href: `/${locale}/dashboard/admin/refunds`,
      icon: <Undo2 className="h-4 w-4" />,
    },
    {
      label: messages.nav.favorites,
      href: `/${locale}/dashboard/admin/favorites`,
      icon: <Heart className="h-4 w-4" />,
    },
    {
      label:
        locale === "ar"
          ? "الملف الشخصي"
          : locale === "fr"
            ? "Profil"
            : "Profile",
      href: `/${locale}/dashboard/admin/profile`,
      icon: <UserCircle2 className="h-4 w-4" />,
    },
  ];

  return (
    <DashboardShell
      locale={locale}
      title={messages.dashboard.admin.title}
      roleLabel={
        locale === "ar"
          ? "حساب المدير"
          : locale === "fr"
            ? "Compte administrateur"
            : "Admin account"
      }
      items={items}
    >
      {children}
    </DashboardShell>
  );
}
