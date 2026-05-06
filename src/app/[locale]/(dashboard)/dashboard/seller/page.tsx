import { ArrowUpRight, ChartColumnBig } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SellerLimitNoticeCard } from "@/components/seller/seller-limit-notice-card";
import { StatGrid } from "@/components/dashboard/stat-grid";
import { formatCompactNumber } from "@/lib/format";
import { getMessages } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/locales";

const getLocalizedPlanText = (
  locale: Locale,
  text: { en: string; ar?: string | null; fr?: string | null },
) => text[locale] ?? text.en;

export default async function SellerOverviewPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const messages = getMessages(locale);
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  if (session.user.role !== "SELLER") {
    redirect(`/${locale}/dashboard/profile`);
  }

  const listingCount = await prisma.property.count({
    where: { sellerId: session.user.id },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { planId: true },
  });

  const planId = user?.planId ?? "free";

  const currentPlan = await prisma.plan.findUnique({
    where: { id: planId },
  });

  const freePlan = currentPlan
    ? null
    : await prisma.plan.findUnique({ where: { id: "free" } });

  const plan = currentPlan ?? freePlan;

  if (!plan) {
    redirect(`/${locale}/dashboard/seller/plan`);
  }

  const limitReached =
    typeof plan.listings === "number" ? listingCount >= plan.listings : false;

  const sellerProperties = await prisma.property.findMany({
    where: { sellerId: session.user.id },
    select: { price: true, featured: true, city: true },
  });

  const featuredCount = sellerProperties.filter(
    (property) => property.featured,
  ).length;
  const averagePrice =
    sellerProperties.length > 0
      ? Math.round(
          sellerProperties.reduce((sum, property) => sum + property.price, 0) /
            sellerProperties.length,
        )
      : 0;
  const uniqueCities = new Set(
    sellerProperties.map((property) => property.city),
  ).size;
  const planLimit = plan.listings;

  const statItems = [
    {
      label: locale === "ar" ? "العقارات المنشورة" : "Live listings",
      value: listingCount,
    },
    {
      label: locale === "ar" ? "العقارات المميزة" : "Featured listings",
      value: featuredCount,
    },
    {
      label: locale === "ar" ? "متوسط السعر" : "Average price",
      value: averagePrice,
    },
    {
      label: locale === "ar" ? "المدن المغطاة" : "Cities covered",
      value: uniqueCities,
    },
  ];

  const recentListings = await prisma.property.findMany({
    where: { sellerId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { id: true, title: true, city: true, price: true },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="accent">{locale === "ar" ? "نشط" : "Active"}</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            {messages.dashboard.seller.overview}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {locale === "ar"
              ? "راقب الأداء والإشعارات والعروض الجديدة."
              : "Track performance, leads, and new opportunities."}
          </p>
        </div>
        {limitReached ? (
          <SellerLimitNoticeCard
            title={messages.dashboard.seller.limitNotice}
            description={messages.common.upgrade}
          />
        ) : null}
      </div>

      <StatGrid
        locale={locale}
        items={statItems.map((item) => ({
          label: item.label,
          value: item.value,
          icon: <ChartColumnBig className="h-4 w-4" />,
        }))}
      />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{messages.dashboard.seller.listings}</CardTitle>
            <Link
              href={`/${locale}/dashboard/seller/listings`}
              className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:underline dark:text-violet-300"
            >
              {locale === "ar" ? "إدارة الكل" : "Manage all"}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentListings.map((property) => (
              <div
                key={property.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-medium">{property.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {property.city}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {formatCompactNumber(property.price, locale)} (MAD)
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{messages.dashboard.seller.plan}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-semibold">
              {getLocalizedPlanText(locale, {
                en: plan.title,
                ar: plan.title_ar,
                fr: plan.title_fr,
              })}
            </div>
            <p className="text-sm text-muted-foreground">
              {getLocalizedPlanText(locale, {
                en: plan.description,
                ar: plan.description_ar,
                fr: plan.description_fr,
              })}
            </p>
            <div className="text-sm text-muted-foreground">
              {listingCount}/{planLimit === null ? "∞" : planLimit}{" "}
              {messages.common.listingCount}
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-linear-to-r from-violet-600 to-fuchsia-600 transition-all"
                style={{
                  width: `${planLimit === null ? 100 : Math.min(100, (listingCount / planLimit) * 100)}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
