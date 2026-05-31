import { PropertyExplorer } from "@/components/property/property-explorer";
import { auth } from "@/auth";
import { getMessages } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { updateAdStatuses } from "@/lib/ad-utils";
import type { Prisma } from "@/generated/prisma/client";
import type { Metadata } from "next";
import type { Locale } from "@/lib/locales";

const PAGE_SIZE = 10;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function normalizeSearchText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function scoreTextMatch(text: string, query: string, tokenList: string[]) {
  const normalizedText = normalizeSearchText(text);
  if (!normalizedText) return 0;

  let score = 0;

  if (normalizedText === query) score += 100;
  if (normalizedText.startsWith(query)) score += 60;
  if (normalizedText.includes(query)) score += 35;

  for (const token of tokenList) {
    if (!token) continue;
    if (normalizedText === token) score += 40;
    else if (normalizedText.startsWith(token)) score += 18;
    else if (normalizedText.includes(token)) score += 10;
  }

  return score;
}

function getSeoCopy(locale: Locale) {
  if (locale === "ar") {
    return {
      title: "تصفح جميع العقارات | منصة تأجير المنازل",
      description:
        "اكتشف عقارات مميزة للإيجار مع فلاتر متقدمة حسب المدينة والسعر وعدد الغرف، وتواصل مباشرة مع بائعين موثقين.",
    };
  }

  if (locale === "fr") {
    return {
      title: "Parcourir toutes les proprietes | Smssar",
      description:
        "Decouvrez des proprietes locatives premium avec des filtres avances par ville, prix et nombre de chambres.",
    };
  }

  return {
    title: "Browse all properties | Smssar",
    description:
      "Discover premium rental properties with advanced filters by city, price, and rooms, and contact verified sellers directly.",
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const seo = getSeoCopy(locale);
  const canonicalPath = `${APP_URL.replace(/\/$/, "")}/${locale}/properties`;

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        en: "/en/properties",
        ar: "/ar/properties",
        fr: "/fr/properties",
        "x-default": "/en/properties",
      },
    },
    openGraph: {
      type: "website",
      url: canonicalPath,
      title: seo.title,
      description: seo.description,
      siteName: "Smssar",
      locale: locale === "ar" ? "ar_AE" : locale === "fr" ? "fr_FR" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

function toPositiveInteger(
  value: string | string[] | undefined,
  fallback: number,
) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default async function PropertiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const messages = getMessages(locale);
  const session = await auth();
  const resolvedSearchParams = (await searchParams) ?? {};
  const currentPage = toPositiveInteger(resolvedSearchParams.page, 1);
  const query = Array.isArray(resolvedSearchParams.query)
    ? resolvedSearchParams.query[0] || ""
    : resolvedSearchParams.query || "";
  const city = Array.isArray(resolvedSearchParams.city)
    ? resolvedSearchParams.city[0] || "all"
    : resolvedSearchParams.city || "all";
  const neighborhood = Array.isArray(resolvedSearchParams.neighborhood)
    ? resolvedSearchParams.neighborhood[0] || "all"
    : resolvedSearchParams.neighborhood || "all";
  const rooms = Array.isArray(resolvedSearchParams.rooms)
    ? resolvedSearchParams.rooms[0] || "all"
    : resolvedSearchParams.rooms || "all";
  const propertyType = Array.isArray(resolvedSearchParams.propertyType)
    ? resolvedSearchParams.propertyType[0] || "all"
    : (resolvedSearchParams.propertyType as string | undefined) || "all";
  const maxPrice = Array.isArray(resolvedSearchParams.maxPrice)
    ? resolvedSearchParams.maxPrice[0] || ""
    : resolvedSearchParams.maxPrice || "";

  const searchable = query.trim();
  const normalizedQuery = normalizeSearchText(searchable);
  const queryTokens = normalizedQuery
    ? normalizedQuery.split(/\s+/).filter(Boolean)
    : [];
  const numericRooms = rooms === "all" ? null : Number.parseInt(rooms, 10);
  const numericMaxPrice = maxPrice ? Number(maxPrice) : null;

  // Use relational filter for seller name instead of fetching seller IDs first
  const sellerNameFilter: Prisma.PropertyWhereInput | undefined = searchable
    ? {
        seller: {
          name: { contains: searchable, mode: "insensitive" as const },
        },
      }
    : undefined;

  const searchFilters: Prisma.PropertyWhereInput[] = [
    { title: { contains: searchable, mode: "insensitive" as const } },
    {
      description: {
        contains: searchable,
        mode: "insensitive" as const,
      },
    },
    { city: { contains: searchable, mode: "insensitive" as const } },
    {
      neighborhood: {
        contains: searchable,
        mode: "insensitive" as const,
      },
    },
  ];

  if (sellerNameFilter) {
    searchFilters.push(sellerNameFilter);
  }

  const where: Prisma.PropertyWhereInput = {
    ...(city !== "all" ? { city } : {}),
    ...(neighborhood !== "all" ? { neighborhood } : {}),
    ...(numericRooms ? { rooms: numericRooms } : {}),
    ...(propertyType !== "all" ? { propertyTypeId: propertyType } : {}),
    ...(numericMaxPrice !== null ? { price: { lte: numericMaxPrice } } : {}),
    ...(searchable ? { OR: searchFilters } : {}),
  };

  // DB-level pagination to avoid loading all rows into memory
  const take = PAGE_SIZE;
  const skip = (currentPage - 1) * PAGE_SIZE;

  // Update ad statuses before fetching properties
  await updateAdStatuses();

  const [totalCount, properties] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      take,
      skip,
      select: {
        id: true,
        title: true,
        description: true,
        city: true,
        neighborhood: true,
        area: true,
        rooms: true,
        bathrooms: true,
        price: true,
        priceType: true,
        propertyTypeId: true,
        propertyType: {
          select: { id: true, name: true },
        },
        _count: {
          select: { favorites: true },
        },
        featured: true,
        imageUrl: true,
        sellerId: true,
        createdAt: true,
        media: {
          select: { id: true, url: true, type: true, publicId: true },
        },
        ads: {
          where: {
            status: "RUNNING",
            startAt: { lte: new Date() },
            endAt: { gte: new Date() },
          },
          select: { id: true, status: true, startAt: true, endAt: true },
        },
      },

      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  // After fetching the paginated properties, fetch related data in parallel
  const propertyIds = properties.map((p) => p.id);

  // Use database time as a consistent server reference (avoids Date.now in render)
  const [{ now: serverNow }] =
    (await prisma.$queryRaw`SELECT now() as now`) as [{ now: Date }];

  const [favoriteRows, sellers] = await Promise.all([
    session?.user?.id
      ? prisma.favorite.findMany({
          where: {
            userId: session.user.id,
            propertyId: { in: propertyIds },
          },
          select: { propertyId: true },
        })
      : Promise.resolve([]),
    prisma.user.findMany({
      where: { id: { in: [...new Set(properties.map((p) => p.sellerId))] } },
      select: { id: true, name: true },
    }),
  ]);

  const favoritePropertyIds = new Set(favoriteRows.map((r) => r.propertyId));

  const sellerMap = new Map(sellers.map((s) => [s.id, s.name]));

  const promotedCountByProperty = new Map<string, number>();
  for (const p of properties) {
    promotedCountByProperty.set(p.id, p.ads?.length ?? 0);
  }

  const [cities, propertyTypes, neighborhoods] = await Promise.all([
    prisma.city.findMany({
      select: {
        name: true,
        name_ar: true,
        name_fr: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.propertyType.findMany({
      select: {
        id: true,
        name: true,
        name_ar: true,
        name_fr: true,
        slug: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.neighborhood.findMany({
      select: {
        name: true,
        name_ar: true,
        name_fr: true,
        city: {
          select: {
            name: true,
            name_ar: true,
            name_fr: true,
          },
        },
      },
      orderBy: [{ city: { name: "asc" } }, { name: "asc" }],
    }),
  ]);

  const transformedProperties = properties.map((property) => {
    const seller = sellerMap.get(property.sellerId) || "Unknown";
    const adCount = promotedCountByProperty.get(property.id) ?? 0;

    return {
      id: property.id,
      title: property.title,
      description: property.description || "",
      city: property.city,
      neighborhood: property.neighborhood || undefined,
      area: property.area || 0,
      rooms: property.rooms || 0,
      bathrooms: property.bathrooms || 0,
      price: property.price || 0,
      priceType: property.priceType,
      propertyType: property.propertyType?.name || "Other",
      featured: property.featured,
      adCount,
      ads: property.ads?.map((a) => ({ id: a.id })) ?? [],
      favoriteCount: property._count.favorites,
      imageUrl: property.imageUrl || undefined,
      seller,
      createdAt: property.createdAt,
      media: property.media.map((m) => ({
        id: m.id,
        url: m.url,
        type: m.type,
        publicId: m.publicId,
      })),
      isFavorite: favoritePropertyIds.has(property.id),
      favoriteEnabled: true,
      _score: (() => {
        const promoted = promotedCountByProperty.get(property.id) ?? 0;
        const featuredScore = property.featured ? 25 : 0;
        const textScore = searchable
          ? [
              scoreTextMatch(property.title, normalizedQuery, queryTokens),
              scoreTextMatch(
                property.description || "",
                normalizedQuery,
                queryTokens,
              ),
              scoreTextMatch(property.city, normalizedQuery, queryTokens),
              scoreTextMatch(
                property.neighborhood || "",
                normalizedQuery,
                queryTokens,
              ),
              scoreTextMatch(
                property.propertyType?.name || "",
                normalizedQuery,
                queryTokens,
              ),
              scoreTextMatch(seller, normalizedQuery, queryTokens),
            ].reduce((sum, v) => sum + v, 0)
          : 0;

        const recencyDays = Math.floor(
          (serverNow.getTime() - property.createdAt.getTime()) / 86400000,
        );
        const recencyScore = Math.max(0, 30 - recencyDays);

        // Balanced scoring: promoted > featured > text > recency
        return promoted * 50 + featuredScore + textScore + recencyScore;
      })(),
    };
  });

  transformedProperties.sort((a, b) => {
    if (b._score !== a._score) return b._score - a._score;
    if (b.featured !== a.featured)
      return Number(b.featured) - Number(a.featured);
    if (b.adCount !== a.adCount) return b.adCount - a.adCount;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  // Properties are already fetched with DB pagination (take/skip)
  const pagedProperties = transformedProperties;

  const seo = getSeoCopy(locale);
  const baseUrl = APP_URL.endsWith("/") ? APP_URL.slice(0, -1) : APP_URL;
  const currency =
    process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ||
    (locale === "ar" ? "MAD" : "USD");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: seo.title,
    description: seo.description,
    inLanguage: locale,
    url: `${baseUrl}/${locale}/properties`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: pagedProperties.length,
      itemListElement: pagedProperties.map((property, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Residence",
          name: property.title,
          description: property.description,
          address: {
            "@type": "PostalAddress",
            addressLocality: property.city,
          },
          floorSize: {
            "@type": "QuantitativeValue",
            value: property.area,
            unitText: "SQM",
          },
          numberOfRooms: property.rooms,
          numberOfBathroomsTotal: property.bathrooms,
          image: property.imageUrl,
          url: `${baseUrl}/${locale}/properties/${property.id}`,
          offers: {
            "@type": "Offer",
            price: property.price,
            priceCurrency: currency,
            availability: "https://schema.org/InStock",
          },
        },
      })),
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PropertyExplorer
        locale={locale}
        properties={pagedProperties}
        cities={cities}
        neighborhoods={neighborhoods}
        propertyTypes={propertyTypes}
        title={messages.properties.title}
        subtitle={messages.properties.subtitle}
        noResults={messages.properties.noResults}
        currentPage={currentPage}
        totalPages={Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
      />
    </div>
  );
}
