import { AdminCitiesPanel } from "@/components/admin/admin-cities-panel";
import { AdminNeighborhoodsPanel } from "@/components/admin/admin-neighborhoods-panel";
import { getMessages } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/locales";

export default async function AdminCitiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };

  const [cities, cityCounts, neighborhoods, neighborhoodCounts] =
    await Promise.all([
      prisma.city.findMany({ orderBy: { name: "asc" } }),
      prisma.property.groupBy({
        by: ["city"],
        _count: { city: true },
      }),
      prisma.neighborhood.findMany({
        include: {
          city: {
            select: {
              id: true,
              name: true,
              name_en: true,
              name_ar: true,
              name_fr: true,
              slug: true,
            },
          },
        },
        orderBy: [{ city: { name: "asc" } }, { name: "asc" }],
      }),
      prisma.property.groupBy({
        by: ["city", "neighborhood"],
        where: { neighborhood: { not: null } },
        _count: { neighborhood: true },
      }),
    ]);

  const countMap = new Map(
    cityCounts.map((item) => [item.city, item._count.city]),
  );
  const initialCities = cities.map((city) => ({
    ...city,
    propertyCount: countMap.get(city.name) ?? 0,
  }));

  const neighborhoodCountMap = new Map(
    neighborhoodCounts.map((item) => [
      `${item.city}::${item.neighborhood}`,
      item._count.neighborhood,
    ]),
  );
  const initialNeighborhoods = neighborhoods.map((neighborhood) => ({
    ...neighborhood,
    propertyCount:
      neighborhoodCountMap.get(
        `${neighborhood.city.name}::${neighborhood.name}`,
      ) ?? 0,
  }));

  const messages = getMessages(locale);
  const citiesPage = messages.dashboard.admin.citiesPage;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {messages.dashboard.admin.cities}
        </h1>
        <p className="mt-2 text-muted-foreground">{citiesPage.intro}</p>
      </div>

      <AdminCitiesPanel locale={locale} initialCities={initialCities} />

      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          {citiesPage.neighborhoodsTitle}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {citiesPage.neighborhoodsDescription}
        </p>
      </div>

      <AdminNeighborhoodsPanel
        locale={locale}
        initialCities={cities}
        initialNeighborhoods={initialNeighborhoods}
      />
    </div>
  );
}
