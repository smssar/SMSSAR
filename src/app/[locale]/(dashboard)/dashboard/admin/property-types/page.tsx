import { AdminPropertyTypesPanel } from "@/components/admin/admin-property-types-panel";
import { getMessages } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/locales";

type AdminPropertyTypesCopy = {
  title: string;
  intro: string;
};

export default async function AdminPropertyTypesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const messages = getMessages(locale);
  const admin = messages.dashboard.admin as typeof messages.dashboard.admin & {
    managementPage?: { propertyTypes?: AdminPropertyTypesCopy };
  };
  const pageCopy =
    admin.managementPage?.propertyTypes ??
    (locale === "ar"
      ? {
          title: "أنواع العقارات",
          intro: "أنشئ أنواع العقارات وادِرها من لوحة الإدارة.",
        }
      : locale === "fr"
        ? {
            title: "Types de propriétés",
            intro:
              "Créez et gérez les types de propriétés depuis le tableau de bord administrateur.",
          }
        : {
            title: "Property Types",
            intro: "Create and manage property types from the admin dashboard.",
          });

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
          {pageCopy.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{pageCopy.intro}</p>
      </div>

      <AdminPropertyTypesPanel
        locale={locale}
        initialPropertyTypes={propertyTypes}
      />
    </div>
  );
}
