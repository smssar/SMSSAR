import { AdminListingsPanel } from "@/components/admin/admin-listings-panel";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";
import { prisma } from "@/lib/prisma";
import { updateAdStatuses } from "@/lib/ad-utils";

function toPositiveInteger(
  value: string | null | undefined,
  defaultValue: number,
): number {
  if (!value) return defaultValue;
  const num = parseInt(value, 10);
  return num > 0 ? num : defaultValue;
}

export default async function AdminListingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const messages = getMessages(locale);

  function getValidPageSize(value: string | null | undefined): number {
    const parsed = parseInt(value || "", 10);
    if (Number.isFinite(parsed) && parsed >= 5 && parsed <= 100) {
      return parsed;
    }
    return 10; // default
  }

  const PAGE_SIZE = getValidPageSize(resolvedSearchParams.pageSize as string);
  const currentPage = toPositiveInteger(resolvedSearchParams.page as string, 1);
  const search = (resolvedSearchParams.search as string) ?? "";
  const listingsPage = messages.dashboard.admin.listingsPage;

  let listings = [];
  let propertyTypes = [];
  let cities = [];
  let neighborhoods = [];
  let sellers: Array<{
    id: string;
    name: string | null;
    email: string | null;
  }> = [];
  let totalCount = 0;

  await updateAdStatuses();

  try {
    const q = search.trim().toLowerCase();
    const where = q
      ? {
          OR: [{ title: { contains: search, mode: "insensitive" as const } }],
        }
      : {};

    const [
      countResult,
      listingsResult,
      propertyTypesResult,
      citiesResult,
      neighborhoodsResult,
      sellersResult,
    ] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
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
          sellerId: true,
          isVerified: true,
          isAvailable: true,
          propertyTypeId: true,
          featured: true,
          imageUrl: true,
          createdAt: true,
          propertyType: {
            select: { id: true, name: true, slug: true, name_ar: true },
          },
          seller: {
            select: { id: true, name: true, email: true },
          },
          media: {
            select: { id: true, url: true, type: true, publicId: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: PAGE_SIZE,
        skip: (currentPage - 1) * PAGE_SIZE,
      }),
      prisma.propertyType.findMany({
        select: { id: true, name: true, name_ar: true, name_fr: true },
        orderBy: { name: "asc" },
      }),
      prisma.city.findMany({
        select: { name: true, name_ar: true, name_fr: true },
        orderBy: { name: "asc" },
      }),
      prisma.neighborhood.findMany({
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
      }),
      prisma.user.findMany({
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      }),
    ]);

    totalCount = countResult;
    const adCountMap = new Map<string, number>();
    const pagePropertyIds = listingsResult.map((item) => item.id);
    if (pagePropertyIds.length > 0) {
      const adCountsResult = await prisma.ad.groupBy({
        by: ["propertyId"],
        where: {
          propertyId: { in: pagePropertyIds },
          deletedAt: null,
          status: { in: ["RUNNING"] },
        },
        _count: { _all: true },
      });

      for (const entry of adCountsResult) {
        if (entry.propertyId) {
          adCountMap.set(entry.propertyId, entry._count._all ?? 0);
        }
      }
    }
    listings = listingsResult.map((item) => ({
      ...item,
      adCount: adCountMap.get(item.id) ?? 0,
    }));
    propertyTypes = propertyTypesResult;
    cities = citiesResult;
    neighborhoods = neighborhoodsResult;
    sellers = (sellersResult || []).map((seller) => ({
      id: seller.id,
      name: seller.name ?? null,
      email: seller.email ?? null,
    }));
  } catch (err) {
    console.error("Prisma query failed in AdminListingsPage:", err);
    throw err;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {messages.dashboard.admin.listings}
        </h1>
        <p className="mt-2 text-muted-foreground">{listingsPage.intro}</p>
      </div>
      <AdminListingsPanel
        locale={locale}
        initialListings={listings}
        propertyTypes={propertyTypes}
        cities={cities}
        neighborhoods={neighborhoods}
        currentPage={currentPage}
        totalPages={totalPages}
        sellers={sellers}
      />
    </div>
  );
}
