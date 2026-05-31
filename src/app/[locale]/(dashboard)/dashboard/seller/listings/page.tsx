import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { getMessages } from "@/lib/messages";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateAdStatuses } from "@/lib/ad-utils";
import type { Locale } from "@/lib/locales";
import { SellerListingsPanel } from "@/components/seller/seller-listings-panel";

export const dynamic = "force-dynamic";

export default async function SellerListingsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const messages = getMessages(locale);
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "SELLER") {
    return null;
  }

  // Update ad statuses before fetching counts
  await updateAdStatuses();

  const properties = await prisma.property.findMany({
    where: { sellerId: session.user.id },
    include: {
      propertyType: {
        select: { id: true, name: true, slug: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch ad counts for seller properties
  const adCountMap = new Map<string, number>();
  const runningAdMap = new Map<string, boolean>();
  const propertyIds = properties.map((p) => p.id);
  if (propertyIds.length > 0) {
    const adCountsResult = await prisma.ad.groupBy({
      by: ["propertyId"],
      where: {
        propertyId: { in: propertyIds },
        deletedAt: null,
        status: { in: ["RUNNING", "SCHEDULED"] },
      },
      _count: { _all: true },
    });

    for (const entry of adCountsResult) {
      if (entry.propertyId) {
        adCountMap.set(entry.propertyId, entry._count._all ?? 0);
      }
    }

    const runningAds = await prisma.ad.findMany({
      where: {
        propertyId: { in: propertyIds },
        deletedAt: null,
        status: "RUNNING",
      },
      select: { propertyId: true },
      distinct: ["propertyId"],
    });

    for (const ad of runningAds) {
      if (ad.propertyId) {
        runningAdMap.set(ad.propertyId, true);
      }
    }
  }

  const propertiesWithAdCounts = properties.map((property) => ({
    ...property,
    adCount: adCountMap.get(property.id) ?? 0,
    hasRunningAd: runningAdMap.get(property.id) ?? false,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {messages.dashboard.seller.listings}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {locale === "ar"
              ? "أدر عقاراتك المنشورة وعدل حالتها فوراً."
              : "Manage your active homes and update them quickly."}
          </p>
        </div>
        <ButtonLink href={`/${locale}/dashboard/seller/add`} variant="accent">
          {messages.dashboard.seller.addHouse}
          <ArrowUpRight className="h-4 w-4" />
        </ButtonLink>
      </div>

      {properties.length === 0 ? (
        <Card className="border-border/70 bg-card/70">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {locale === "ar"
                ? "لم تقم بإنشاء أي عقار حتى الآن"
                : "You haven't created any listings yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <SellerListingsPanel
          locale={locale}
          properties={propertiesWithAdCounts}
        />
      )}
    </div>
  );
}
