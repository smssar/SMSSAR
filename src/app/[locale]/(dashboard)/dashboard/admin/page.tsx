import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatGrid } from "@/components/dashboard/stat-grid";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

export default async function AdminOverviewPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const messages = getMessages(locale);

  const [
    totalUsers,
    activeListings,
    totalCategories,
    totalCities,
    recentUsers,
    recentListings,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.property.count(),
    prisma.category.count(),
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
    {
      label: {
        en: "Total users",
        ar: "إجمالي المستخدمين",
        fr: "Utilisateurs totaux",
      },
      value: totalUsers,
    },
    {
      label: {
        en: "Active listings",
        ar: "العقارات النشطة",
        fr: "Annonces actives",
      },
      value: activeListings,
    },
    {
      label: { en: "Categories", ar: "الفئات", fr: "Catégories" },
      value: totalCategories,
    },
    { label: { en: "Cities", ar: "المدن", fr: "Villes" }, value: totalCities },
  ] as const;

  const getRoleBadge = (role: string) =>
    role === "ADMIN" ? "accent" : role === "SELLER" ? "secondary" : "outline";
  const getStatusBadge = (status: string) =>
    status === "ACTIVE" ? "accent" : "secondary";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {messages.dashboard.admin.overview}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {locale === "ar"
            ? "لوحة تحكم شاملة لإدارة المستخدمين والعقارات والخطط."
            : "Unified control center for users, listings, plans, and reports."}
        </p>
      </div>
      <StatGrid
        locale={locale}
        items={stats.map((item) => ({
          label: item.label[locale],
          value: item.value,
        }))}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>{messages.dashboard.admin.users}</CardTitle>
            <ButtonLink
              href={`/${locale}/dashboard/admin/users`}
              variant="outline"
              size="sm"
            >
              {locale === "ar" ? "عرض كل المستخدمين" : "View all users"}
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
              {locale === "ar" ? "عرض كل العقارات" : "View all listings"}
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
      </div>
    </div>
  );
}
