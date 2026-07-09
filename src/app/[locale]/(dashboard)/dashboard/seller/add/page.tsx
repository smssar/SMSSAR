import { ListingForm } from "@/components/property/listing-form";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export default async function SellerAddPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const messages = getMessages(locale);
  const session = await auth();

  const [propertyTypes, cities] = await Promise.all([
    prisma.propertyType.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        name_ar: true,
        name_fr: true,
        slug: true,
      },
    }),
    prisma.city.findMany({
      select: { name: true, name_ar: true, name_fr: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const neighborhoods = await prisma.neighborhood.findMany({
    include: {
      city: {
        select: {
          id: true,
          name: true,
          name_ar: true,
          name_fr: true,
          slug: true,
        },
      },
    },
    orderBy: [{ city: { name: "asc" } }, { name: "asc" }],
  });

  // Fetch featured listing info for current user
  let featuredInfo = { current: 0, max: 0, extraFeatured: 0, upgradeUrl: `/${locale}/pricing` };
  
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { planId: true, featuredproperties: true },
    });

    if (user?.planId) {
      const plan = await prisma.plan.findUnique({
        where: { id: user.planId },
        select: { maxFeaturedListings: true },
      });

      const purchases = await prisma.purchase.findMany({
        where: {
          userId: session.user.id,
          status: "ACTIVE",
          purchaseProduct: { code: "EXTRA_FEATURED_LISTINGS" },
        },
        select: { quantity: true },
      });

      const extraFeatured = purchases.reduce((sum, p) => sum + p.quantity, 0);
      const maxFeatured = (plan?.maxFeaturedListings ?? 0) + extraFeatured;

      featuredInfo = {
        current: user.featuredproperties ?? 0,
        max: maxFeatured,
        extraFeatured,
        upgradeUrl: `/${locale}/pricing`,
      };
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {messages.dashboard.seller.addHouse}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {locale === "ar"
            ? "أنشئ عقاراً جديداً مع صور ومزايا وخطة اشتراك مناسبة."
            : "Create a new listing with photos, amenities, and plan-aware limits."}
        </p>
      </div>
      <ListingForm
        locale={locale}
        title={messages.dashboard.seller.addHouse}
        propertyTypes={propertyTypes}
        cities={cities}
        neighborhoods={neighborhoods}
        featuredInfo={featuredInfo}
        userRole={session?.user?.role || "USER"}
      />
    </div>
  );
}
