import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { getMessages } from "@/lib/messages";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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

  const properties = await prisma.property.findMany({
    where: { sellerId: session.user.id },
    include: {
      propertyType: {
        select: { id: true, name: true, slug: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

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
        <SellerListingsPanel locale={locale} properties={properties} />
      )}
    </div>
  );
}
