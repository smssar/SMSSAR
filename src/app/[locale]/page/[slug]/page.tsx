import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
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
import PropertyCard from "../../../../components/property/property-card";

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

  const localizedKeywords = Array.isArray(page.seoKeywords)
    ? page.seoKeywords.map((keyword) => String(keyword).trim()).filter(Boolean)
    : [];

  const fallbackKeywords = [
    page.title,
    getLocalizedFromSuffixed(page as any, "title", locale),
    page.description,
    getLocalizedField(page as any, "description", locale),
    getLocalizedFromSuffixed(page as any, "seoTitle", locale),
    getLocalizedFromSuffixed(page as any, "seoDescription", locale),
  ]
    .filter(Boolean)
    .map((keyword) => String(keyword));

  const keywords = Array.from(
    new Set([...localizedKeywords, ...fallbackKeywords]),
  ).slice(0, 12);

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
    keywords,

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
    properties = await prisma.property.findMany({
      where: { ...where, isAvailable: true },
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
              {properties.length}{" "}
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
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  locale={locale}
                />
              ))}
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
