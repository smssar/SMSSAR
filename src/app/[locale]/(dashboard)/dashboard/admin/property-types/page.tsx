import { AdminPropertyTypesPanel } from "@/components/admin/admin-property-types-panel";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/locales";

export default async function AdminPropertyTypesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };

  const propertyTypes = await prisma.propertyType.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { properties: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {locale === "ar" ? "أنواع العقارات" : "Property Types"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {locale === "ar"
            ? "أنشئ وأدر أنواع العقارات من لوحة الإدارة."
            : "Create and manage property types from the admin dashboard."}
        </p>
      </div>

      <AdminPropertyTypesPanel
        locale={locale}
        initialPropertyTypes={propertyTypes}
      />
    </div>
  );
}
