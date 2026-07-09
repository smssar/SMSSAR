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
import { resolvePlanForRole } from "@/lib/role-pricing";
import {
  getActivePurchasesWithProduct,
  sumPurchaseQuantityByCode,
  buildPlanAllowance,
} from "@/lib/purchase-allowances";

const getLocalizedPlanText = (
  locale: Locale,
  text: { en: string; ar?: string | null; fr?: string | null },
) => text[locale] ?? text.en;

export default async function SmssarOverviewPage({
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

  if (session.user.role !== "SELLER" && session.user.role !== "SMSSAR") {
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
    : await prisma.plan.findUnique({ where: { id: "plan_free" } });

  const plan = currentPlan ?? freePlan;

  if (!plan) {
    redirect(`/${locale}/dashboard/smssar/plan`);
  }

  // Resolve plan for SMSSAR user role
  const effectivePlan = resolvePlanForRole(plan, session.user.role);

  const activePurchases = await getActivePurchasesWithProduct(session.user.id);

  const extraListings = sumPurchaseQuantityByCode(
    activePurchases,
    "EXTRA_LISTINGS",
  );

  // Calculate effective limit using resolved plan
  const planLimit = buildPlanAllowance(
    effectivePlan.smssarListings,
    extraListings,
  );
  const baseLimitReached = planLimit !== Infinity && listingCount >= planLimit;

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

  const extraPurchases = await prisma.purchase.findMany({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
      quantity: { gt: 0 },
      purchaseProduct: { code: "EXTRA_LISTINGS" },
    },
    include: { purchaseProduct: true },
  });

  const totalExtraListings = extraPurchases.reduce(
    (sum, p) => sum + p.quantity,
    0,
  );

  const extraSlotsUsed =
    typeof plan.smssarListings === "number"
      ? Math.max(0, listingCount - plan.smssarListings)
      : 0;
  const remainingExtraListings = Math.max(
    0,
    totalExtraListings - extraSlotsUsed,
  );

  const statItems = [
    {
      label:
        locale === "ar"
          ? "العقارات المنشورة"
          : locale === "fr"
            ? "Annonces publiées"
            : "Published listings",
      value: listingCount,
    },
    {
      label:
        locale === "ar"
          ? "العقارات المميزة"
          : locale === "fr"
            ? "Annonces en vedette"
            : "Featured listings",
      value: featuredCount,
    },
    {
      label:
        locale === "ar"
          ? "متوسط السعر"
          : locale === "fr"
            ? "Prix moyen"
            : "Average price",
      value: averagePrice,
    },
    {
      label:
        locale === "ar"
          ? "المدن المغطاة"
          : locale === "fr"
            ? "Villes couvertes"
            : "Cities covered",
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
          <Badge variant="accent">
            {locale === "ar" ? "نشط" : locale === "fr" ? "Actif" : "Active"}
          </Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            {messages.dashboard.seller.overview}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {locale === "ar"
              ? "راقب الأداء والإشعارات والعروض الجديدة."
              : locale === "fr"
                ? "Suivez les performances, les prospects et les nouvelles opportunités."
                : "Track performance, leads, and new opportunities."}
          </p>
        </div>
        {/**
         * Show different notices depending on extras:
         * - If effective limit reached (base + extras consumed): show upgrade/purchase notice
         * - If base plan is full but extras remain: show a card allowing the seller to add listings (uses purchased extras)
         */}
        {baseLimitReached && totalExtraListings > 0 ? (
          remainingExtraListings > 0 ? (
            <Card className="border-violet-300 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/40">
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-5 w-5 shrink-0 text-violet-600 dark:text-violet-300">
                      ⚡
                    </div>
                    <div>
                      <div className="font-semibold text-violet-900 dark:text-violet-100">
                        {locale === "ar"
                          ? "لديك قوائم إضافية"
                          : locale === "fr"
                            ? "Listes supplémentaires disponibles"
                            : "Extra listings available"}
                      </div>
                      <div className="mt-1 text-sm text-violet-800 dark:text-violet-200">
                        {locale === "ar"
                          ? `لديك ${remainingExtraListings} قوائم إضافية متبقية. يمكنك إضافة المزيد من العقارات الآن.`
                          : locale === "fr"
                            ? `Vous avez ${remainingExtraListings} listes supplémentaires disponibles. Vous pouvez ajouter davantage d'annonces.`
                            : `You have ${remainingExtraListings} purchased extra listings remaining. You can add more listings now.`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/${locale}/dashboard/smssar/add`}
                      className="inline-flex items-center rounded-md bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700"
                    >
                      {locale === "ar"
                        ? "أضف عقار"
                        : locale === "fr"
                          ? "Ajouter une annonce"
                          : "Add listing"}
                    </Link>
                    <Link
                      href={`/${locale}/dashboard/smssar/purchases`}
                      className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      {locale === "ar"
                        ? "إدارة المشتريات"
                        : locale === "fr"
                          ? "Gérer les achats"
                          : "Manage purchases"}
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <SellerLimitNoticeCard
              title={
                locale === "ar"
                  ? "تم استخدام جميع القوائم الإضافية"
                  : locale === "fr"
                    ? "Toutes les listes supplémentaires ont été المستخدمة"
                    : "All purchased extra listings are used"
              }
              description={
                locale === "ar"
                  ? "لقد استخدمت جميع القوائم المشتراة. قم بشراء المزيد من الإعلانات أو ترقية خطتك."
                  : locale === "fr"
                    ? "Vous avez utilisé toutes les listes achetées. Achetez-en davantage أو passez à un forfait supérieur."
                    : "You have used all purchased extra listings. Buy more or upgrade your plan."
              }
              locale={locale}
            />
          )
        ) : baseLimitReached ? (
          <SellerLimitNoticeCard
            title={messages.dashboard.seller.limitNotice}
            description={messages.common.upgrade}
            locale={locale}
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{messages.dashboard.seller.listings}</CardTitle>
            <Link
              href={`/${locale}/dashboard/smssar/listings`}
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
                en: effectivePlan.title,
                ar: effectivePlan.title_ar,
                fr: effectivePlan.title_fr,
              })}
            </div>
            <p className="text-sm text-muted-foreground">
              {getLocalizedPlanText(locale, {
                en: effectivePlan.description,
                ar: effectivePlan.description_ar,
                fr: effectivePlan.description_fr,
              })}
            </p>
          </CardContent>
        </Card>

        <Card className="border-violet-300 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/40">
          <CardContent className="flex flex-col gap-3 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-5 w-5 shrink-0 text-violet-600 dark:text-violet-300">
                ⚡
              </div>
              <div>
                <div className="font-semibold text-violet-900 dark:text-violet-100">
                  {locale === "ar"
                    ? "حد العقارات"
                    : locale === "fr"
                      ? "Limite de listes"
                      : "Listing limit"}
                </div>
                <div className="mt-1 text-sm text-violet-800 dark:text-violet-200">
                  {locale === "ar"
                    ? "عدد العقارات التي يمكنك نشرها بناءً على خطتك الحالية."
                    : locale === "fr"
                      ? "Le nombre de listes que vous pouvez publier مع votre forfait actuel."
                      : "The number of listings you can publish based on your current plan."}
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {listingCount}/{planLimit === Infinity ? "∞" : planLimit}{" "}
              {messages.common.listingCount}
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-full rounded-full bg-white transition-all">
                <div
                  className="h-full rounded-full bg-linear-to-r from-violet-600 to-fuchsia-600 transition-all"
                  style={{
                    width: `${planLimit === Infinity ? 100 : Math.min(100, (listingCount / planLimit) * 100)}%`,
                  }}
                />
              </div>
            </div>
            {baseLimitReached && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {locale === "ar"
                  ? "لقد وصلت إلى حد قوائم خطتك الأساسية."
                  : locale === "fr"
                    ? "Vous avez atteint la limite de votre forfait de base."
                    : "You have reached your base plan listing limit."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
