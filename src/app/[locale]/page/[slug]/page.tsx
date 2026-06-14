import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SiteFooter, SiteNavbar } from "@/components/layout";
import { auth } from "@/auth";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";
import {
  getLocalizedFromSuffixed,
  getLocalizedField,
} from "@/lib/page-localization";

/* eslint-disable @typescript-eslint/no-explicit-any */

async function getLocale() {
  const cookieStore = await cookies();
  return cookieStore.get("locale")?.value || "en";
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const page = await prisma.page.findUnique({
    where: { slug: resolvedParams.slug },
  });

  if (!page) return {};
  if (!page.published) {
    return {};
  }

  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value || "en") as Locale;

  const localizedTitle =
    getLocalizedFromSuffixed(page as any, "seoTitle", locale) ||
    getLocalizedFromSuffixed(page as any, "title", locale) ||
    page.title;
  const localizedDesc =
    getLocalizedFromSuffixed(page as any, "seoDescription", locale) ||
    getLocalizedField(page as any, "description", locale) ||
    page.description ||
    "";

  return {
    title: localizedTitle,
    description: localizedDesc,

    openGraph: {
      title: localizedTitle,
      description: localizedDesc,
      images: page.ogImage ? [page.ogImage] : [],
      type: "website",
    },

    alternates: {
      canonical: `/page/${page.slug}`,
    },
  };
}

export default async function CmsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const locale = (await getLocale()) as Locale;

  const page = await prisma.page.findUnique({
    where: { slug: resolvedParams.slug },
  });

  if (!page) {
    notFound();
  }

  const pageAny = page as any;
  const messages = getMessages(locale);
  const session = await auth();
  const buildWhere = async (p: any) => {
    const where: any = {};
    const and: any[] = [];

    if (p.prioritiesCityIds?.length) {
      // Properties store city as a name string, so map city IDs -> names
      const cities = await prisma.city.findMany({
        where: { id: { in: p.prioritiesCityIds } },
        select: { name: true },
      });
      const cityNames = cities.map((c) => c.name).filter(Boolean);
      if (cityNames.length) {
        and.push({ city: { in: cityNames } });
      }
    }

    if (p.propertiesNeighborhoods?.length) {
      // Properties store neighborhood as a name string, so map neighborhood IDs -> names
      const neighborhoods = await prisma.neighborhood.findMany({
        where: { id: { in: p.propertiesNeighborhoods } },
        select: { name: true },
      });
      const neighborhoodNames = neighborhoods
        .map((n) => n.name)
        .filter(Boolean);
      if (neighborhoodNames.length) {
        and.push({ neighborhood: { in: neighborhoodNames } });
      }
    }

    if (p.prioritiesPropertyTypeIds?.length) {
      and.push({
        OR: [
          { propertyTypeId: { in: p.prioritiesPropertyTypeIds } },
          { propertyType: { id: { in: p.prioritiesPropertyTypeIds } } },
        ],
      });
    }

    if (p.prioritiesForSale !== null && p.prioritiesForSale !== undefined) {
      and.push({ forSale: p.prioritiesForSale });
    }

    if (p.prioritiesFeatured !== null && p.prioritiesFeatured !== undefined) {
      and.push({ featured: p.prioritiesFeatured });
    }

    if (p.prioritiesMinPrice != null) {
      and.push({ price: { gte: p.prioritiesMinPrice } });
    }
    if (p.prioritiesMaxPrice != null) {
      and.push({ price: { lte: p.prioritiesMaxPrice } });
    }

    if (p.prioritiesMinArea != null) {
      and.push({ area: { gte: p.prioritiesMinArea } });
    }
    if (p.prioritiesMaxArea != null) {
      and.push({ area: { lte: p.prioritiesMaxArea } });
    }

    if (p.prioritiesMinRooms != null) {
      and.push({ rooms: { gte: p.prioritiesMinRooms } });
    }
    if (p.prioritiesMaxRooms != null) {
      and.push({ rooms: { lte: p.prioritiesMaxRooms } });
    }

    if (p.prioritiesMinBathrooms != null) {
      and.push({ bathrooms: { gte: p.prioritiesMinBathrooms } });
    }
    if (p.prioritiesMaxBathrooms != null) {
      and.push({ bathrooms: { lte: p.prioritiesMaxBathrooms } });
    }

    if (p.prioritiesPriceType) {
      and.push({ priceType: p.prioritiesPriceType });
    }

    if (and.length) where.AND = and;
    return where;
  };

  let properties: any[] = [];
  try {
    const where = await buildWhere(pageAny);
    console.log(where);
    properties = await prisma.property.findMany({
      where,
      include: { propertyType: true, seller: true, media: true },
      orderBy: [{ featured: "desc" }, { price: "asc" }],
      take: 200,
    });
  } catch {
    // If the property query fails for any reason, return an empty list.
    properties = [];
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: page.title,
    description: page.description,
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://smssar.ma"}/page/${page.slug}`,
  };

  return (
    <>
      <SiteNavbar locale={locale} messages={messages} session={session} />
      <main className="max-w-6xl mx-auto px-4 py-12 space-y-16">
        {/* SEO SCHEMA */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema),
          }}
        />

        {/* HERO */}
        <section className="text-center space-y-4">
          <h1 className="text-5xl font-bold">
            {getLocalizedFromSuffixed(page as any, "title", locale)}
          </h1>

          {(() => {
            const hero = getLocalizedFromSuffixed(
              page as any,
              "heroText",
              locale,
            );
            return (
              hero && (
                <p className="text-xl text-gray-600 font-medium">
                  {getLocalizedFromSuffixed(page as any, "heroText", locale)}
                </p>
              )
            );
          })()}

          {(() => {
            const sub = getLocalizedFromSuffixed(
              page as any,
              "subtitle",
              locale,
            );
            return sub && <p className="text-gray-500">{sub}</p>;
          })()}
        </section>

        {/* DESCRIPTION */}
        {page.description && (
          <section className="max-w-3xl mx-auto text-center text-gray-700 text-lg">
            {locale === "ar"
              ? page.description_ar
              : locale === "fr"
                ? page.description_fr || page.description
                : page.description}
          </section>
        )}

        {/* PROPERTIES */}
        {properties.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold mb-10 text-center">
              {properties.length}
              {properties.length === 1
                ? locale === "ar"
                  ? "خاصية"
                  : locale === "fr"
                    ? "Propriété"
                    : "Property"
                : locale === "ar"
                  ? "خصائص"
                  : locale === "fr"
                    ? "Propriétés"
                    : "Properties"}
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {properties.map((property, index) => {
                const images =
                  property.media?.filter((m: any) => m.type === "image") || [];
                const videos =
                  property.media?.filter((m: any) => m.type === "video") || [];

                const mainImage = images[0]?.url;
                const mainVideo = videos[0]?.url;

                return (
                  <div
                    key={property.id}
                    className="rounded-xl overflow-hidden border shadow hover:shadow-lg transition bg-white"
                  >
                    {mainImage && (
                      <Image
                        src={mainImage}
                        alt={property.title}
                        width={500}
                        height={300}
                        priority={index === 0}
                        className="w-full h-48 object-cover"
                      />
                    )}

                    {/* MAIN VIDEO (fallback if no image) */}
                    {!mainImage && mainVideo && (
                      <video
                        src={mainVideo}
                        controls
                        className="w-full h-48 object-cover"
                      />
                    )}

                    {/* OPTIONAL: MULTIPLE IMAGES INDICATOR */}
                    {images.length > 1 && (
                      <div className="text-xs text-gray-500 px-2 py-1">
                        +{images.length - 1} more photos
                      </div>
                    )}

                    {/* ---------------- CONTENT ---------------- */}
                    <div className="p-4 space-y-2">
                      <h3 className="font-bold text-lg">{property.title}</h3>

                      <p className="text-sm text-gray-500">
                        {property.city}
                        {property.neighborhood && ` • ${property.neighborhood}`}
                      </p>

                      <p className="text-blue-600 font-semibold">
                        {property.price.toLocaleString()}{" "}
                        {locale === "ar"
                          ? "د.م."
                          : locale === "fr"
                            ? "MAD"
                            : "MAD"}
                      </p>

                      <p className="text-sm text-gray-500">
                        {property.rooms}{" "}
                        {locale == "ar"
                          ? "غرف"
                          : locale == "fr"
                            ? "chambres"
                            : "rooms"}{" "}
                        • {property.bathrooms ?? 0}{" "}
                        {locale === "ar"
                          ? "حمام"
                          : locale === "fr"
                            ? "salles de bain"
                            : "baths"}
                      </p>

                      {property.propertyType && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {locale === "ar"
                            ? property.propertyType.name_ar ||
                              property.propertyType.name
                            : locale === "fr"
                              ? property.propertyType.name_fr ||
                                property.propertyType.name
                              : property.propertyType.name}
                        </span>
                      )}

                      {/* BUTTON (localized) */}
                      <Link
                        href={`/${locale}/properties/${property.id}`}
                        className="mt-3 inline-block w-full text-center bg-black text-white py-2 rounded-lg hover:bg-gray-800"
                      >
                        {locale === "ar"
                          ? "عرض التفاصيل"
                          : locale === "fr"
                            ? "Voir les détails"
                            : "View Details"}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ARTICLE CONTENT */}
        <div className=" mx-auto text-gray-700">
          <p className="text-lg leading-relaxed whitespace-pre-line text-justify rtl:text-right ltr:text-left">
            {locale === "ar"
              ? page.article_ar
              : locale === "fr"
                ? page.article_fr || page.article
                : page.article}
          </p>
        </div>
      </main>
      <SiteFooter locale={locale} messages={messages} />
    </>
  );
}
