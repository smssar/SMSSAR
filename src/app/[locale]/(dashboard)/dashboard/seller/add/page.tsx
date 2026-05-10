import { ListingForm } from "@/components/property/listing-form";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";
import { prisma } from "@/lib/prisma";

export default async function SellerAddPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const messages = getMessages(locale);

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
      />
    </div>
  );
}
