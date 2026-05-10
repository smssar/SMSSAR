import { notFound } from "next/navigation";
import { ListingForm } from "@/components/property/listing-form";
import { getMessages } from "@/lib/messages";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/locales";
import type { Property } from "@/lib/site-data";
import { getDirection } from "@/lib/locales";
import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;
  const messages = getMessages(locale);
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "SELLER") {
    notFound();
  }

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      propertyType: {
        select: {
          id: true,
          name: true,
          name_ar: true,
          name_fr: true,
          slug: true,
        },
      },
      media: {
        select: { id: true, url: true, publicId: true, type: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!property || property.sellerId !== session.user.id) {
    notFound();
  }

  const [propertyTypes, allCities] = await Promise.all([
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

  // Convert database property to ListingForm compatible format
  const priceType =
    (
      property as typeof property & {
        priceType?: "MONTHLY" | "DAILY";
      }
    ).priceType ?? "MONTHLY";

  const formProperty = {
    id: property.id,
    title: { [locale]: property.title },
    city: { [locale]: property.city },
    neighborhood: property.neighborhood ?? "",
    description: { [locale]: property.description || "" },
    imageUrl: property.imageUrl ?? undefined,
    price: property.price,
    priceType,
    rooms: property.rooms,
    bathrooms: property.bathrooms || 1,
    area: property.area || 0,
    featured: property.featured,
    propertyType: property.propertyType?.id || "",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        {/* For LTR locales show Back button on left */}
        {getDirection(locale) === "ltr" ? (
          <ButtonLink
            href={`/${locale}/dashboard/seller/listings`}
            variant="ghost"
            className="inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {locale === "ar" ? "رجوع" : "Back"}
          </ButtonLink>
        ) : (
          <div />
        )}

        <div className="flex-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            {messages.dashboard.seller.editHouse}
          </h1>
          <p className="mt-2 text-muted-foreground">{property.title}</p>
        </div>

        {/* For RTL locales show Back button on right */}
        {getDirection(locale) === "rtl" ? (
          <ButtonLink
            href={`/${locale}/dashboard/seller/listings`}
            variant="ghost"
            className="inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {locale === "ar" ? "رجوع" : "Back"}
          </ButtonLink>
        ) : (
          <div />
        )}
      </div>

      <ListingForm
        locale={locale}
        title={messages.dashboard.seller.editHouse}
        defaultListing={formProperty as Property}
        propertyId={id}
        existingMedia={property.media}
        propertyTypes={propertyTypes}
        cities={allCities}
        neighborhoods={neighborhoods}
      />
    </div>
  );
}
