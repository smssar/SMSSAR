import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatGrid } from "@/components/dashboard/stat-grid";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

type AdminOverviewCopy = {
  intro: string;
  viewAllUsers: string;
  viewAllListings: string;
  totalUsers: string;
  activeListings: string;
  propertyTypes: string;
  cities: string;
};

export default async function AdminOverviewPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const messages = getMessages(locale);

  const overviewPage: AdminOverviewCopy = {
    intro:
      locale === "ar"
        ? "لوحة تحكم شاملة لإدارة المستخدمين والعقارات والخطط."
        : locale === "fr"
          ? "Unified control center for users, listings, plans, and reports."
          : "Unified control center for users, listings, plans, and reports.",
    viewAllUsers: locale === "ar" ? "عرض كل المستخدمين" : "View all users",
    viewAllListings: locale === "ar" ? "عرض كل العقارات" : "View all listings",
    totalUsers: locale === "ar" ? "إجمالي المستخدمين" : "Total users",
    activeListings: locale === "ar" ? "العقارات النشطة" : "Active listings",
    propertyTypes: locale === "ar" ? "أنواع العقارات" : "Property types",
    cities: locale === "ar" ? "المدن" : "Cities",
  };

  const [
    totalUsers,
    activeListings,
    totalPropertyTypes,
    totalCities,
    recentUsers,
    recentListings,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.property.count(),
    prisma.propertyType.count(),
    prisma.city.count(),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.property.findMany({
      select: {
        id: true,
        title: true,
        city: true,
        price: true,
        featured: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const stats = [
    { label: overviewPage.totalUsers, value: totalUsers },
    { label: overviewPage.activeListings, value: activeListings },
    { label: overviewPage.propertyTypes, value: totalPropertyTypes },
    { label: overviewPage.cities, value: totalCities },
  ] as const;

  const getRoleBadge = (role: string) =>
    role === "ADMIN"
      ? "accent"
      : role === "SELLER" || role === "SMSSAR"
        ? "secondary"
        : "outline";
  const getStatusBadge = (status: string) =>
    status === "ACTIVE" ? "accent" : "secondary";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {messages.dashboard.admin.overview}
        </h1>
        <p className="mt-2 text-muted-foreground">{overviewPage.intro}</p>
      </div>
      <StatGrid
        locale={locale}
        items={stats.map((item) => ({
          label: item.label,
          value: item.value,
        }))}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>{messages.dashboard.admin.users}</CardTitle>
            <ButtonLink
              href={`/${locale}/dashboard/admin/users`}
              variant="outline"
              size="sm"
            >
              {overviewPage.viewAllUsers}
            </ButtonLink>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-2xl border border-border/70 px-4 py-3 text-sm"
              >
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-muted-foreground">{user.email}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={getRoleBadge(user.role)}>{user.role}</Badge>
                  <Badge variant={getStatusBadge(user.status)}>
                    {user.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>{messages.dashboard.admin.listings}</CardTitle>
            <ButtonLink
              href={`/${locale}/dashboard/admin/listings`}
              variant="outline"
              size="sm"
            >
              {overviewPage.viewAllListings}
            </ButtonLink>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentListings.map((property) => (
              <div
                key={property.id}
                className="flex items-center justify-between rounded-2xl border border-border/70 px-4 py-3 text-sm"
              >
                <div>
                  <div className="font-medium">{property.title}</div>
                  <div className="text-muted-foreground">{property.city}</div>
                </div>
                <div className="flex flex-col items-end gap-2 text-muted-foreground">
                  <span>{formatCurrency(property.price, locale)}</span>
                  <Badge variant={property.featured ? "accent" : "secondary"}>
                    {property.featured
                      ? locale === "ar"
                        ? "مميز"
                        : "Featured"
                      : locale === "ar"
                        ? "عادي"
                        : "Regular"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>
              {locale === "ar"
                ? "المبالغ المسترجعة"
                : locale === "fr"
                  ? "Remboursements"
                  : "Refunds"}
            </CardTitle>
            <ButtonLink
              href={`/${locale}/dashboard/admin/refunds`}
              variant="outline"
              size="sm"
            >
              {locale === "ar"
                ? "إدارة المبالغ"
                : locale === "fr"
                  ? "Gérer"
                  : "Manage"}
            </ButtonLink>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {locale === "ar"
                ? "إدارة استرجاع المبالغ المدفوعة للمستخدمين"
                : locale === "fr"
                  ? "Gérer les remboursements des paiements utilisateur"
                  : "Manage refunds for user payments"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
