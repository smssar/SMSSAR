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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PropertyCard,
  type PropertyCardProps,
} from "@/components/property/property-card";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/locales";

export default async function SellerProfilePage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;

  const seller = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      bio: true,
      createdAt: true,
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
          media: {
            select: { id: true, url: true, type: true, publicId: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!seller) {
    notFound();
  }

  const listingCount = seller.properties.length;
  const memberSince = new Date(seller.createdAt).toLocaleDateString(locale);

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
      seller: seller.name ?? "",
      rating: 4.8,
      inquiries: 0,
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
              <div className="text-2xl font-semibold">{seller.name}</div>
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
                <a
                  href={`tel:${seller.phone}`}
                  className="inline-flex items-center gap-2 font-medium text-foreground transition hover:text-violet-500"
                >
                  <Phone className="h-4 w-4" />
                  {seller.phone}
                </a>
              ) : null}

              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                {locale === "ar"
                  ? "بائع موثق مع استجابة سريعة"
                  : "Verified seller with fast response"}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {locale === "ar"
                  ? `${listingCount} عقار`
                  : `${listingCount} listings`}
              </Badge>
              {seller.phone ? (
                <Badge variant="outline">
                  {locale === "ar" ? "متاح للاتصال" : "Available by phone"}
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
                  : "Browse all properties published by this seller."}
              </p>
            </div>

            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {locale === "ar"
                ? `${listingCount} إعلان`
                : `${listingCount} listings`}
            </Badge>
          </div>

          {sellerProperties.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {sellerProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  locale={locale}
                  property={property}
                />
              ))}
            </div>
          ) : (
            <Card className="border-border/70">
              <CardContent className="py-10 text-center text-muted-foreground">
                {locale === "ar"
                  ? "لا توجد عقارات منشورة حتى الآن."
                  : "No listings published yet."}
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
