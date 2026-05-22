"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PropertyCard } from "@/components/property/property-card";
import type { Locale } from "@/lib/locales";

const t = <T extends { en: string; ar: string; fr: string }>(
  locale: Locale,
  text: T,
) => text[locale] ?? text.en;

export interface SimpleProperty {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  city: string;
  neighborhood?: string;
  area: number;
  rooms: number;
  bathrooms: number;
  price: number;
  propertyType: string;
  featured: boolean;
  seller: string;
  media?: Array<{ id: string; url: string; type: string; publicId: string }>;
}

type LocalizedLabel = {
  name: string;
  name_ar?: string | null;
  name_fr?: string | null;
};

function getLocalizedLabel(locale: Locale, item: LocalizedLabel) {
  if (locale === "ar") return item.name_ar || item.name;
  if (locale === "fr") return item.name_fr || item.name;
  return item.name;
}

export function PropertyExplorer({
  locale,
  properties,
  cities,
  neighborhoods: allNeighborhoods,
  propertyTypes,
  title,
  subtitle,
  noResults,
  currentPage,
  totalPages,
}: {
  locale: Locale;
  properties: SimpleProperty[];
  cities: Array<LocalizedLabel>;
  neighborhoods: Array<{
    name: string;
    name_ar?: string | null;
    name_fr?: string | null;
    city: LocalizedLabel;
  }>;
  propertyTypes: Array<LocalizedLabel & { id: string; slug: string | null }>;
  title: string;
  subtitle: string;
  noResults: string;
  currentPage: number;
  totalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initializedRef = useRef(false);

  const initialFilters = {
    query: "",
    city: "all",
    neighborhood: "all",
    rooms: "all",
    propertyType: "all",
    maxPrice: "",
  };

  const [pendingFilters, setPendingFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const urlQuery = searchParams.get("query") || "";
    const urlCity = searchParams.get("city") || "all";
    const urlNeighborhood = searchParams.get("neighborhood") || "all";
    const urlRooms = searchParams.get("rooms") || "all";
    const urlPropertyType = searchParams.get("propertyType") || "all";
    const urlMaxPrice = searchParams.get("maxPrice") || "";

    // Reset neighborhood if city changed and selected neighborhood is not available
    let finalNeighborhood = urlNeighborhood;
    if (urlNeighborhood !== "all") {
      const isNeighborhoodValid = allNeighborhoods.some(
        (n) => n.name === urlNeighborhood && n.city.name === urlCity,
      );
      if (!isNeighborhoodValid) {
        finalNeighborhood = "all";
      }
    }

    const filters = {
      query: urlQuery,
      city: urlCity,
      neighborhood: finalNeighborhood,
      rooms: urlRooms,
      propertyType: urlPropertyType,
      maxPrice: urlMaxPrice,
    };

    if (!initializedRef.current) {
      setPendingFilters(filters);
      initializedRef.current = true;
      return;
    }

    setPendingFilters(filters);
  }, [searchParams, allNeighborhoods]);

  const setPageParam = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    router.push(params.toString() ? `?${params.toString()}` : "?");
  };

  const applyFilters = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const params = new URLSearchParams();
      if (pendingFilters.query) params.set("query", pendingFilters.query);
      if (pendingFilters.city !== "all")
        params.set("city", pendingFilters.city);
      if (pendingFilters.neighborhood !== "all") {
        params.set("neighborhood", pendingFilters.neighborhood);
      }
      if (pendingFilters.rooms !== "all")
        params.set("rooms", pendingFilters.rooms);
      if (pendingFilters.propertyType !== "all")
        params.set("propertyType", pendingFilters.propertyType);
      if (pendingFilters.maxPrice)
        params.set("maxPrice", pendingFilters.maxPrice);
      params.set("page", "1");

      router.push(`?${params.toString()}`);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    const emptyFilters = {
      query: "",
      city: "all",
      neighborhood: "all",
      rooms: "all",
      propertyType: "all",
      maxPrice: "",
    };
    setPendingFilters(emptyFilters);
    router.push("?");
  };

  const getAvailableNeighborhoods = () => {
    const selectedCity =
      pendingFilters.city !== "all" ? pendingFilters.city : null;
    if (!selectedCity) {
      return allNeighborhoods;
    }
    return allNeighborhoods.filter((n) => n.city.name === selectedCity);
  };

  const availableNeighborhoods = getAvailableNeighborhoods();

  return (
    <div className="space-y-8">
      <Card className="border-border/70 bg-card/95 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <label className="mb-2 block text-sm font-medium">
              {t(locale, { en: "Search", ar: "ابحث", fr: "Recherche" })}
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-4" />
              <Input
                value={pendingFilters.query}
                onChange={(event) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    query: event.target.value,
                  }))
                }
                placeholder={t(locale, {
                  en: "City, home, or seller",
                  ar: "مدينة أو عقار أو بائع",
                  fr: "Ville, logement ou vendeur",
                })}
                className="pl-11 rtl:pr-11 rtl:pl-4"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              {t(locale, { en: "City", ar: "المدينة", fr: "Ville" })}
            </label>
            <Select
              value={pendingFilters.city}
              onChange={(event) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  city: event.target.value,
                  neighborhood: "all",
                }))
              }
            >
              <option value="all">
                {t(locale, { en: "All", ar: "الكل", fr: "Tous" })}
              </option>
              {cities.map((item) => (
                <option key={item.name} value={item.name}>
                  {getLocalizedLabel(locale, item)}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              {t(locale, { en: "Neighborhood", ar: "الحي", fr: "Quartier" })}
            </label>
            <Select
              value={pendingFilters.neighborhood}
              onChange={(event) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  neighborhood: event.target.value,
                }))
              }
            >
              <option value="all">
                {t(locale, { en: "All", ar: "الكل", fr: "Tous" })}
              </option>
              {availableNeighborhoods.map((item) => (
                <option key={item.name} value={item.name}>
                  {getLocalizedLabel(locale, item)}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              {t(locale, { en: "Rooms", ar: "عدد الغرف", fr: "Chambres" })}
            </label>
            <Select
              value={pendingFilters.rooms}
              onChange={(event) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  rooms: event.target.value,
                }))
              }
            >
              <option value="all">
                {t(locale, { en: "All", ar: "الكل", fr: "Tous" })}
              </option>
              {[1, 2, 3, 4, 5].map((room) => (
                <option key={room} value={room}>
                  {room}+
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              {t(locale, {
                en: "Property type",
                ar: "نوع العقار",
                fr: "Type de propriete",
              })}
            </label>
            <Select
              value={pendingFilters.propertyType}
              onChange={(event) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  propertyType: event.target.value,
                }))
              }
            >
              <option value="all">
                {t(locale, { en: "All", ar: "الكل", fr: "Tous" })}
              </option>
              {propertyTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {getLocalizedLabel(locale, item)}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              {t(locale, {
                en: "Max price",
                ar: "أعلى سعر",
                fr: "Prix maximum",
              })}
            </label>
            <Input
              value={pendingFilters.maxPrice}
              onChange={(event) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  maxPrice: event.target.value,
                }))
              }
              inputMode="numeric"
            />
          </div>
        </CardContent>
        <div className="flex flex-wrap items-center gap-3 px-6 pb-6">
          <Button
            type="button"
            variant="accent"
            onClick={applyFilters}
            disabled={isLoading}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t(locale, {
                  en: "Loading...",
                  ar: "جاري التحميل...",
                  fr: "Chargement...",
                })}
              </>
            ) : (
              t(locale, {
                en: "Apply filters",
                ar: "تطبيق الفلاتر",
                fr: "Appliquer",
              })
            )}
          </Button>
          <Button type="button" variant="outline" onClick={reset}>
            {t(locale, {
              en: "Clear filters",
              ar: "مسح الفلاتر",
              fr: "Effacer",
            })}
          </Button>
          <span className="text-sm text-muted-foreground">
            {properties.length}{" "}
            {t(locale, { en: "results", ar: "نتيجة", fr: "resultats" })}
          </span>
        </div>
      </Card>

      <div className="space-y-6">
        {properties.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                locale={locale}
                property={property}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex min-h-64 items-center justify-center text-center text-muted-foreground">
              {noResults}
            </CardContent>
          </Card>
        )}

        {properties.length > 0 && totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/70 px-4 py-3">
            <div className="text-sm text-muted-foreground">
              {t(locale, { en: "Page", ar: "الصفحة", fr: "Page" })}{" "}
              {currentPage} / {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPageParam(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                {t(locale, { en: "Previous", ar: "السابق", fr: "Precedent" })}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setPageParam(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
              >
                {t(locale, { en: "Next", ar: "التالي", fr: "Suivant" })}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
