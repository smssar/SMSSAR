import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Heart,
  MapPin,
  Phone,
  Ruler,
  ShieldCheck,
  UserRound,
  BadgeCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { getMessages } from "@/lib/messages";
import { properties } from "@/lib/site-data";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import type { Locale } from "@/lib/locales";
import type { Property } from "@/lib/site-data";
import type { ReactNode } from "react";
import MediaSwiper from "@/components/media/media-swiper-client";
import { FavoriteButton } from "@/components/property/favorite-button";
import ExpandableText from "@/components/ui/expandable-text";

type PropertyDisplay = Property & {
  sellerId?: string;
  sellerPhone?: string | null;
  sellerBio?: string | null;
  sellerCity?: string | null;
  role?: string | null;
  media?: Array<{
    id: string;
    url: string;
    resourceType: "image" | "video";
  }>;
  isVerified?: boolean;
  isVerifiedUser?: boolean;
  hasAd?: boolean;
};

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;
  const messages = getMessages(locale);
  const session = await auth();

  // Try to find property in mock data first
  let property: PropertyDisplay | undefined = properties.find(
    (item) => item.id === id,
  );

  // If not found in mock data, fetch from database
  if (!property) {
    const dbProperty = await prisma.property.findUnique({
      where: { id },
      include: {
        propertyType: {
          select: { id: true, name: true, slug: true },
        },
        seller: {
          select: {
            id: true,
            role: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            bio: true,
            isVerified: true,
          },
        },
        media: {
          select: { url: true, type: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!dbProperty) {
      notFound();
    }

    const activeAd = await prisma.ad.findFirst({
      where: {
        propertyId: dbProperty.id,
        status: { in: ["RUNNING", "SCHEDULED"] },
      },
      select: { id: true },
    });

    const normalizedPriceType =
      (dbProperty.priceType ?? "MONTHLY").toUpperCase() === "DAILY"
        ? ("DAILY" as "MONTHLY" | "DAILY")
        : ("MONTHLY" as "MONTHLY" | "DAILY");

    // Convert database property to display format
    property = {
      id: dbProperty.id,
      title: {
        en: dbProperty.title,
        ar: dbProperty.title,
        fr: dbProperty.title,
      },
      description: {
        en: dbProperty.description || "",
        ar: dbProperty.description || "",
        fr: dbProperty.description || "",
      },
      imageUrl: dbProperty.imageUrl ?? undefined,
      city: { en: dbProperty.city, ar: dbProperty.city, fr: dbProperty.city },
      area: dbProperty.area ?? 0,
      rooms: dbProperty.rooms,
      bathrooms: dbProperty.bathrooms ?? 0,
      price: dbProperty.price,
      isVerified: dbProperty.isVerified,
      priceType: normalizedPriceType,
      propertyType: dbProperty.propertyType?.name || "Other",
      featured: dbProperty.featured,
      seller: dbProperty.seller?.name || "Seller",
      sellerId: dbProperty.seller?.id,
      sellerPhone: dbProperty.seller?.phone ?? null,
      sellerBio: dbProperty.seller?.bio ?? null,
      sellerCity: dbProperty.seller?.city ?? null,
      role: dbProperty.seller?.role ?? null,
      isVerifiedUser: dbProperty.seller?.isVerified ?? false,
      hasAd: Boolean(activeAd),
      palette: ["from-blue-500", "to-indigo-600"] as [string, string],
      amenities: [],
      // include media for client swiper
      media:
        dbProperty.media?.map((m) => ({
          id: `${dbProperty.id}-${m.url}`,
          url: m.url,
          resourceType: m.type as "image" | "video",
        })) ?? [],
    };
  }

  if (!property) {
    notFound();
  }

  const isDatabaseProperty = Boolean(property.sellerId);
  const favorite =
    session?.user?.id && isDatabaseProperty
      ? await prisma.favorite.findUnique({
          where: {
            userId_propertyId: {
              userId: session.user.id,
              propertyId: property.id,
            },
          },
          select: { id: true },
        })
      : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href={`/${locale}/properties`}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {locale === "ar" ? "العودة إلى العقارات" : "Back to properties"}
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden border-border/70 p-4">
          <div>
            <div className="relative ">
              {/* Hydrate client-side media swiper */}
              {/* prepare media array for the client swiper: include imageUrl as cover and any media, deduped by URL */}
              {(() => {
                const items: Array<{
                  id: string;
                  url: string;
                  resourceType: "image" | "video";
                }> = [];

                if (property.imageUrl) {
                  items.push({
                    id: `${property.id}-cover`,
                    url: property.imageUrl,
                    resourceType: "image",
                  });
                }

                if (property.media?.length) {
                  for (const m of property.media) {
                    if (!items.some((i) => i.url === m.url)) {
                      items.push(m);
                    }
                  }
                }

                return <MediaSwiper media={items} />;
              })()}
            </div>
            <div className="mt-4">
              {/* <div className="flex flex-wrap gap-2 items-center">
                {property.featured ? (
                  <Badge variant="accent">{messages.common.featured}</Badge>
                ) : null}
                {property.hasAd ? (
                  <Badge
                    variant="secondary"
                    className="bg-white/15 text-muted-foreground"
                  >
                    {messages.common.ad}
                  </Badge>
                ) : null}
                <Badge
                  variant="secondary"
                  className="bg-white/15 text-muted-foreground"
                >
                  {property.city[locale]}
                </Badge>
              </div> */}
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
                {property.title[locale]}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {property.city[locale]}
                </span>
              </div>
            </div>
          </div>
          <CardContent className="space-y-8 p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Metric
                icon={<BedDouble className="h-4 w-4" />}
                label={messages.common.rooms}
                value={`${property.rooms}`}
              />
              <Metric
                icon={<Bath className="h-4 w-4" />}
                label={messages.properties.bath}
                value={`${property.bathrooms}`}
              />
              <Metric
                icon={<Ruler className="h-4 w-4" />}
                label={messages.properties.size}
                value={`${property.area} m²`}
              />
            </div>

            <div>
              <h2 className="text-xl font-semibold">
                {messages.common.description}
              </h2>
              <div className="mt-3">
                {/* Client-side toggle for long descriptions */}
                <ExpandableText
                  text={property.description[locale]}
                  maxLength={200}
                  locale={locale}
                />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold">
                {messages.common.amenities}
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {property.amenities.map((amenity, index) => (
                  <Badge
                    key={`${property.id}-amenity-${index}`}
                    variant="outline"
                    className="bg-muted/30"
                  >
                    {amenity[locale]}
                  </Badge>
                ))}
              </div>
            </div>

            {property.sellerBio && (
              <div>
                <h2 className="text-xl font-semibold">
                  {locale === "ar"
                    ? "السيرة الذاتية للبائع"
                    : locale === "fr"
                      ? "Profil du vendeur"
                      : "Seller bio"}
                </h2>
                <div className="mt-2">
                  <ExpandableText
                    text={property.sellerBio || ""}
                    maxLength={200}
                    locale={locale}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{messages.properties.sellerCard}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {locale === "ar"
                    ? "اسم البائع"
                    : locale === "fr"
                      ? "Nom du vendeur"
                      : "Seller"}
                </span>

                <span>{property.seller}</span>

                {property.isVerifiedUser && (
                  <BadgeCheck className="h-6 w-6 fill-blue-500 text-white" />
                )}
              </div>
              {property.sellerCity ? (
                <div className="text-sm text-muted-foreground">
                  {locale === "ar"
                    ? "المدينة"
                    : locale === "fr"
                      ? "Ville"
                      : "City"}
                  : {property.sellerCity}
                </div>
              ) : null}
              {property.isVerified && property.role === "SELLER" ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/30">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-[0.18em] ">
                        {locale === "ar"
                          ? " هذا العقار تم نشره من طرف صاحب المنزل "
                          : locale === "fr"
                            ? "Cette propriété a été publiée par le propriétaire"
                            : "This property was posted by the homeowner"}
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant="secondary"
                    className="inline-flex mt-2 items-center gap-1 border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {locale === "ar"
                      ? "هذا العقار موثّق"
                      : locale === "fr"
                        ? "Cette propriété est vérifiée"
                        : "This property is Verified"}
                  </Badge>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {locale === "ar"
                    ? "هذا العقار تم نشره من طرف صاحب المنزل"
                    : locale === "fr"
                      ? "Cette propriété a été publiée par le propriétaire"
                      : "This property was posted by the homeowner"}
                </div>
              )}
              {property.isVerified && property.role === "SMSSAR" ? (
                <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {locale === "ar"
                          ? "هذا العقار موثّق"
                          : locale === "fr"
                            ? "Cette propriété est vérifiée"
                            : "This property is verified"}
                      </span>
                      {property.isVerifiedUser && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                          {locale === "ar"
                            ? "بائع موثق مع استجابة سريعة"
                            : locale === "fr"
                              ? "Vendeur vérifié avec réponse rapide"
                              : "Verified seller with fast response"}
                        </div>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {locale === "ar"
                        ? "راجع فريق Smssar هذا الإعلان للتأكد من صحة بياناته."
                        : locale === "fr"
                          ? "Cette annonce a été vérifiée par l'équipe Smssar."
                          : "This listing has been reviewed by the Smssar team."}
                    </p>
                  </div>

                  <Badge
                    variant="secondary"
                    className="inline-flex mt-2 items-center gap-1 border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {locale === "ar"
                      ? "هذا العقار موثّق"
                      : locale === "fr"
                        ? "Cette propriété est vérifiée"
                        : "This property is Verified"}
                  </Badge>
                </div>
              ) : property.role === "SMSSAR" ? (
                <div className="text-sm text-muted-foreground">
                  {locale === "ar"
                    ? "هذا العقار تم نشره من طرف وسيط عقاري "
                    : locale === "fr"
                      ? "Cette propriété a été publiée par un agent immobilier"
                      : "This property was posted by real estate agent"}
                </div>
              ) : null}

              {/* <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="ltr:text-right rtl:rotate-270 h-5 w-5 text-violet-600 shrink-0" />
                :
                {property.sellerPhone ? (
                  <a
                    href={`tel:${property.sellerPhone}`}
                    className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted/60 hover:border-violet-500/50 active:scale-95"
                  >
                    <span dir="ltr">{property.sellerPhone}</span>
                  </a>
                ) : null} */}
              {/* </div> */}

              <div className="grid gap-3 sm:grid-cols-2">
                {property.sellerId ? (
                  <ButtonLink
                    href={`/${locale}/sellers/${property.sellerId}`}
                    target="_blank"
                    variant="outline"
                    className="w-full"
                  >
                    <UserRound className="h-4 w-4" />
                    {locale === "ar"
                      ? "زيارة ملف البائع"
                      : locale === "fr"
                        ? "Visiter le profil du vendeur"
                        : "Visit seller profile"}
                  </ButtonLink>
                ) : null}
                {property.sellerPhone ? (
                  <ButtonLink
                    href={`tel:${property.sellerPhone}`}
                    variant="outline"
                    className="w-full"
                  >
                    <Phone className="h-4 w-4" />
                    {locale === "ar"
                      ? "اتصل بالبائع"
                      : locale === "fr"
                        ? "Appeler le vendeur"
                        : "Call seller"}
                  </ButtonLink>
                ) : null}
              </div>
              {property.sellerPhone ? (
                <ButtonLink
                  href={`https://wa.me/${property.sellerPhone.replace(/\D/g, "")}`}
                  target="_blank"
                  variant="accent"
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    aria-hidden="true"
                    role="img"
                  >
                    <path
                      fill="white"
                      d="M20.52 3.48A11.95 11.95 0 0012 0C5.37 0 .11 5.26.11 11.89c0 2.1.55 4.16 1.6 5.98L0 24l6.36-1.63A11.9 11.9 0 0012 23.89c6.63 0 11.89-5.26 11.89-11.89 0-3.19-1.24-6.16-3.37-8.52z"
                    />
                    <path
                      fill="white"
                      d="M17.56 14.11c-.29-.14-1.69-.83-1.95-.93-.26-.09-.45-.14-.65.15-.2.29-.75.93-.92 1.12-.17.2-.34.22-.63.08-.29-.14-1.21-.45-2.3-1.43-.83-.74-1.39-1.65-1.55-1.94-.17-.29-.02-.45.12-.6.13-.13.29-.36.44-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.69-1.67-.95-2.29-.25-.62-.52-.53-.71-.54l-.61-.01c-.19 0-.5.07-.75.33-.26.26-.98.99-.98 2.42 0 1.42 1 3.05 1.14 3.26.14.21 1.97 3.04 5.06 4.39 0 0 .04.02.09.03.42.13.83.19 1.23.19.55 0 1.08-.08 1.57-.24.2-.06.52-.22.59-.4.07-.18.07-.33.05-.45-.02-.12-.08-.19-.17-.23z"
                    />
                  </svg>
                  <span className="ml-2">
                    {locale === "ar"
                      ? "تواصل عبر واتساب"
                      : locale === "fr"
                        ? "Contactez sur WhatsApp"
                        : "Contact on WhatsApp"}
                  </span>
                </ButtonLink>
              ) : null}
              {session?.user?.id ? (
                <FavoriteButton
                  key={`${property.id}-${Boolean(favorite)}`}
                  locale={locale}
                  propertyId={property.id}
                  initialFavorite={Boolean(favorite)}
                  enabled={isDatabaseProperty}
                  className="w-full"
                />
              ) : (
                <ButtonLink
                  href={`/${locale}/login`}
                  variant="accent"
                  className="w-full"
                >
                  {messages.common.save}
                  <Heart className="h-4 w-4" />
                </ButtonLink>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{messages.common.overview}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <InfoRow
                label={messages.common.price}
                value={`
                  ${formatCurrency(property.price, locale)} ${
                    (property.priceType ?? "MONTHLY").toUpperCase() === "DAILY"
                      ? locale === "ar"
                        ? "/اليوم"
                        : locale === "fr"
                          ? "/jour"
                          : "/day"
                      : messages.common.monthly
                  }
                `}
              />
              <InfoRow
                label={messages.properties.location}
                value={
                  (property.city[locale as keyof typeof property.city] ??
                    property.city.en) as string
                }
              />
              <InfoRow
                label={locale === "ar" ? "نوع العقار" : "Property type"}
                value={property.propertyType}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-border/70 bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-2 text-xl font-semibold">{value}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-muted/30 px-4 py-3">
      <span>{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
