import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Building2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  BadgeCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PropertyCard,
  type PropertyCardProps,
} from "@/components/property/property-card";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/locales";
import {
  defaultPhoneCountry,
  detectPhoneCountry,
  formatPhoneDisplay,
  getPhoneCountryByCode,
} from "@/lib/phone";

export default async function SellerProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, id } = await params;
  const resolvedSearchParams = await searchParams;
  const pageParam =
    typeof resolvedSearchParams.page === "string"
      ? resolvedSearchParams.page
      : undefined;
  const requestedPage = Number.parseInt(pageParam ?? "1", 10);
  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const PAGE_SIZE = 9;

  const seller = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      bio: true,
      isVerified: true,
      createdAt: true,
      _count: {
        select: {
          properties: true,
        },
      },
      properties: {
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          city: true,
          area: true,
          rooms: true,
          bathrooms: true,
          price: true,
          featured: true,
          propertyType: {
            select: { name: true },
          },
          _count: {
            select: { favorites: true },
          },
          media: {
            select: { id: true, url: true, type: true, publicId: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: PAGE_SIZE,
        skip: (currentPage - 1) * PAGE_SIZE,
      },
    },
  });

  if (!seller) {
    notFound();
  }

  const listingCount = seller._count.properties;
  const totalPages = Math.max(1, Math.ceil(listingCount / PAGE_SIZE));
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const buildPageHref = (page: number) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    return `/${locale}/sellers/${id}?${params.toString()}`;
  };
  const memberSince = new Date(seller.createdAt).toLocaleDateString(locale);
  const phoneCountryCode = seller.phone
    ? (detectPhoneCountry(seller.phone) ?? defaultPhoneCountry.code)
    : defaultPhoneCountry.code;
  const selectedPhoneCountry = getPhoneCountryByCode(phoneCountryCode);

  const sellerProperties: PropertyCardProps[] = seller.properties.map(
    (property) => ({
      id: property.id,
      title: property.title,
      description: property.description || "",
      imageUrl: property.imageUrl ?? undefined,
      city: property.city,
      area: property.area ?? 0,
      rooms: property.rooms,
      bathrooms: property.bathrooms ?? 0,
      price: property.price,
      propertyType: property.propertyType?.name || "Other",
      featured: property.featured,
      favoriteCount: property._count.favorites,
      seller: seller.name ?? "",
      media: property.media || [],
    }),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href={`/${locale}/properties`}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {locale === "ar" ? "العودة إلى العقارات" : "Back to properties"}
      </Link>

      <div className="mt-6 space-y-10">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-violet-500" />
              {locale === "ar" ? "ملف البائع" : "Seller profile"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {locale === "ar" ? "الاسم" : "Name"}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-semibold">{seller.name}</div>
                {seller.isVerified && (
                  <BadgeCheck className="h-6 w-6 fill-blue-500 text-white" />
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  {locale === "ar" ? "الإعلانات" : "Listings"}
                </div>
                <div className="mt-2 text-2xl font-semibold">
                  {listingCount}
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {locale === "ar" ? "المدينة" : "City"}
                </div>
                <div className="mt-2 truncate text-lg font-semibold">
                  {seller.city || (locale === "ar" ? "غير متوفر" : "N/A")}
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  {locale === "ar" ? "عضو منذ" : "Member since"}
                </div>
                <div className="mt-2 text-lg font-semibold">{memberSince}</div>
              </div>
            </div>

            {seller.bio ? (
              <p className="rounded-2xl bg-muted/40 p-4 text-sm leading-7 text-muted-foreground">
                {seller.bio}
              </p>
            ) : null}

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                {seller.email}
              </div>

              {seller.phone ? (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    {locale === "ar" ? "رقم الهاتف" : "Phone"}
                  </div>
                  <a
                    href={`tel:${seller.phone}`}
                    className="inline-flex w-full max-w-sm items-stretch overflow-hidden rounded-2xl border border-border/70 transition hover:border-violet-400/60"
                  >
                    <span className="inline-flex items-center gap-2 border-r border-border/70 bg-muted/40 px-3 py-2 text-sm rtl:border-l rtl:border-r-0">
                      {selectedPhoneCountry.flag}{" "}
                      {selectedPhoneCountry.dialCode}
                    </span>
                    <span className="inline-flex items-center gap-2 px-3 py-2 font-medium text-foreground">
                      <Phone className="h-4 w-4" />
                      <span dir="ltr">{formatPhoneDisplay(seller.phone)}</span>
                    </span>
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {selectedPhoneCountry.flag} {selectedPhoneCountry.dialCode}{" "}
                    {locale === "ar"
                      ? "• تم التحقق من تنسيق الرقم تلقائياً."
                      : locale === "fr"
                        ? "• Format vérifié automatiquement."
                        : "• Format checked automatically."}
                  </p>
                </div>
              ) : null}

              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                {locale === "ar"
                  ? "بائع موثق مع استجابة سريعة"
                  : locale === "fr"
                    ? "Vendeur vérifié avec réponse rapide"
                    : "Verified seller with fast response"}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {locale === "ar"
                  ? `${listingCount} عقار`
                  : locale === "fr"
                    ? `${listingCount} annonces`
                    : `${listingCount} listings`}
              </Badge>
              {seller.phone ? (
                <Badge variant="outline">
                  {locale === "ar"
                    ? "متاح للاتصال"
                    : locale === "fr"
                      ? "Disponible par téléphone"
                      : "Available by phone"}
                </Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                {locale === "ar" ? "عقارات البائع" : "Seller listings"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {locale === "ar"
                  ? "تصفح جميع العقارات المنشورة بواسطة هذا البائع."
                  : locale === "fr"
                    ? "Parcourez toutes les propriétés publiées par ce vendeur."
                    : "Browse all properties published by this seller."}
              </p>
            </div>
          </div>

          {sellerProperties.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {sellerProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    locale={locale}
                    property={property}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  {locale === "ar"
                    ? `الصفحة ${currentPage} من ${totalPages}`
                    : locale === "fr"
                      ? `Page ${currentPage} sur ${totalPages}`
                      : `Page ${currentPage} of ${totalPages}`}
                </p>
                <div className="flex items-center gap-2">
                  {hasPreviousPage ? (
                    <Link
                      href={buildPageHref(currentPage - 1)}
                      className="inline-flex items-center rounded-xl border border-border/70 px-3 py-1.5 text-sm font-medium transition hover:bg-muted"
                    >
                      {locale === "ar"
                        ? "السابق"
                        : locale === "fr"
                          ? "Precedent"
                          : "Previous"}
                    </Link>
                  ) : (
                    <span className="inline-flex cursor-not-allowed items-center rounded-xl border border-border/50 px-3 py-1.5 text-sm text-muted-foreground/70">
                      {locale === "ar"
                        ? "السابق"
                        : locale === "fr"
                          ? "Precedent"
                          : "Previous"}
                    </span>
                  )}

                  {hasNextPage ? (
                    <Link
                      href={buildPageHref(currentPage + 1)}
                      className="inline-flex items-center rounded-xl border border-border/70 px-3 py-1.5 text-sm font-medium transition hover:bg-muted"
                    >
                      {locale === "ar"
                        ? "التالي"
                        : locale === "fr"
                          ? "Suivant"
                          : "Next"}
                    </Link>
                  ) : (
                    <span className="inline-flex cursor-not-allowed items-center rounded-xl border border-border/50 px-3 py-1.5 text-sm text-muted-foreground/70">
                      {locale === "ar"
                        ? "التالي"
                        : locale === "fr"
                          ? "Suivant"
                          : "Next"}
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <Card className="border-border/70">
              <CardContent className="py-10 text-center text-muted-foreground">
                {locale === "ar"
                  ? "لا توجد عقارات منشورة حتى الآن."
                  : locale === "fr"
                    ? "Aucune annonce publiee pour le moment."
                    : "No listings published yet."}
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
