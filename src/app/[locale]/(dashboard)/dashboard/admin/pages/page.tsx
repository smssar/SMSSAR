import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/locales";
import PagesAdminClient from "@/components/admin/pages-admin-client";
import { getMessages } from "@/lib/messages";
import { FileText } from "lucide-react";

export default async function AdminPages({
  params,
}: {
  params: { locale: Locale };
}) {
  const { locale } = await params;
  const messages = getMessages(locale);

  const pages = await prisma.page.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const citiesRaw = await prisma.city.findMany({
    select: {
      id: true,
      name: true,
      name_en: true,
      name_ar: true,
      name_fr: true,
    },
  });

  const neighborhoodsRaw = await prisma.neighborhood.findMany({
    select: {
      id: true,
      name: true,
      name_en: true,
      name_ar: true,
      name_fr: true,
      cityId: true,
      city: {
        select: {
          id: true,
          name: true,
          name_en: true,
          name_ar: true,
          name_fr: true,
        },
      },
    },
  });

  const propertyTypesRaw = await prisma.propertyType.findMany({
    select: {
      id: true,
      name: true,
      name_en: true,
      name_ar: true,
      name_fr: true,
    },
  });

  const pickLocalized = (record: unknown, locale: string) => {
    const rec = record as Record<string, string | undefined | null>;
    if (locale === "ar") return rec.name_ar || rec.name_en || rec.name || "";
    if (locale === "fr") return rec.name_fr || rec.name_en || rec.name || "";
    return rec.name_en || rec.name || "";
  };

  const cities = citiesRaw.map((c) => ({
    id: c.id,
    name: pickLocalized(c, locale),
  }));

  const neighborhoods = neighborhoodsRaw.map((n) => ({
    id: n.id,
    name: pickLocalized(n, locale),
    cityId: n.cityId,
    cityName: pickLocalized(n.city, locale),
  }));

  const propertyTypes = propertyTypesRaw.map((t) => ({
    id: t.id,
    name: pickLocalized(t, locale),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-border/60 pb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {messages.adminPages?.title || "Admin — Pages"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {locale === "ar"
              ? "أنشئ صفحات مخصصة مع تحسين محركات البحث وتفضيلات العقارات"
              : locale === "fr"
                ? "Créez des pages personnalisées avec SEO et priorités de propriétés"
                : "Create custom pages with SEO and property priorities"}
          </p>
        </div>
      </div>
      <PagesAdminClient
        initialPages={pages}
        cities={cities}
        neighborhoods={neighborhoods}
        propertyTypes={propertyTypes}
        messages={messages}
        locale={locale}
      />
    </div>
  );
}
