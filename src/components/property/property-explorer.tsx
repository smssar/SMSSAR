"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Locale } from "@/lib/locales";
import PropertyCard from "./property-card";

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
  priceType?: string;
  propertyType: string;
  featured: boolean;
  adCount?: number;
  ads?: Array<{ id: string }>;
  favoriteCount?: number;
  seller: string;
  media?: Array<{ id: string; url: string; type: string; publicId: string }>;
}

type LocalizedLabel = {
  name: string;
  name_ar?: string | null;
  name_fr?: string | null;
};

type FilterState = {
  query: string;
  city: string;
  neighborhood: string;
  rooms: string;
  propertyType: string;
  minPrice: string;
  maxPrice: string;
};

function getLocalizedLabel(locale: Locale, item: LocalizedLabel) {
  if (locale === "ar") return item.name_ar || item.name;
  if (locale === "fr") return item.name_fr || item.name;
  return item.name;
}

function getFiltersFromSearchParams(
  searchParams: URLSearchParams,
  allNeighborhoods: Array<{
    name: string;
    name_ar?: string | null;
    name_fr?: string | null;
    city: LocalizedLabel;
  }>,
): FilterState {
  const urlQuery = searchParams.get("query") || "";
  const urlCity = searchParams.get("city") || "all";
  const urlNeighborhood = searchParams.get("neighborhood") || "all";
  const urlRooms = searchParams.get("rooms") || "all";
  const urlPropertyType = searchParams.get("propertyType") || "all";
  const urlMinPrice = searchParams.get("minPrice") || "";
  const urlMaxPrice = searchParams.get("maxPrice") || "";

  let finalNeighborhood = urlNeighborhood;
  if (urlNeighborhood !== "all") {
    const isNeighborhoodValid = allNeighborhoods.some(
      (n) => n.name === urlNeighborhood && n.city.name === urlCity,
    );
    if (!isNeighborhoodValid) {
      finalNeighborhood = "all";
    }
  }

  return {
    query: urlQuery,
    city: urlCity,
    neighborhood: finalNeighborhood,
    rooms: urlRooms,
    propertyType: urlPropertyType,
    minPrice: urlMinPrice,
    maxPrice: urlMaxPrice,
  };
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
  isLoading = false,
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
  isLoading?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendingQueryString, setPendingQueryString] = useState<string | null>(null);
  const [isDraftDirty, setIsDraftDirty] = useState(false);

  const initialFilters: FilterState = getFiltersFromSearchParams(
    searchParams,
    allNeighborhoods,
  );

  const [pendingFilters, setPendingFilters] = useState(initialFilters);
  const [isError, setIsError] = useState(false);

  const currentQueryString = searchParams.toString();
  const isApplyingFilters =
    pendingQueryString !== null && pendingQueryString !== currentQueryString;
  const showLoading = isApplyingFilters || isLoading;

  const currentFilters = useMemo(() => {
    return getFiltersFromSearchParams(searchParams, allNeighborhoods);
  }, [searchParams, allNeighborhoods]);

  const activeFilters = isApplyingFilters || isDraftDirty
    ? pendingFilters
    : currentFilters;

  const setPageParam = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    const nextQueryString = params.toString();
    setIsDraftDirty(false);
    setPendingQueryString(nextQueryString);
    router.push(nextQueryString ? `?${nextQueryString}` : "?");
  };

  const applyFilters = async () => {
    try {
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
      if (pendingFilters.minPrice)
        params.set("minPrice", pendingFilters.minPrice);
      if (pendingFilters.maxPrice)
        params.set("maxPrice", pendingFilters.maxPrice);
      params.set("page", "1");

      const nextQueryString = params.toString();
      setIsDraftDirty(false);
      setPendingQueryString(nextQueryString);
      router.push(`?${nextQueryString}`);
    } catch {
      setIsError(true);
      setPendingQueryString(null);
    }
  };

  const reset = () => {
    const emptyFilters = {
      query: "",
      city: "all",
      neighborhood: "all",
      rooms: "all",
      propertyType: "all",
      minPrice: "",
      maxPrice: "",
    };
    setPendingFilters(emptyFilters);
    setIsDraftDirty(false);
    setPendingQueryString("");
    router.push("?");
  };

  const getAvailableNeighborhoods = () => {
    const selectedCity =
      activeFilters.city !== "all" ? activeFilters.city : null;
    if (!selectedCity) {
      return allNeighborhoods;
    }
    return allNeighborhoods.filter((n) => n.city.name === selectedCity);
  };

  const availableNeighborhoods = getAvailableNeighborhoods();
  const isCitySelected = activeFilters.city !== "all";

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
                value={activeFilters.query}
                onChange={(event) =>
                  (setIsDraftDirty(true),
                  setPendingFilters((prev) => ({
                    ...prev,
                    query: event.target.value,
                  })))
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
              value={activeFilters.city}
              onChange={(event) =>
                (setIsDraftDirty(true),
                setPendingFilters((prev) => ({
                  ...prev,
                  city: event.target.value,
                  neighborhood: "all",
                })))
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
              value={activeFilters.neighborhood}
              disabled={!isCitySelected}
              onChange={(event) =>
                (setIsDraftDirty(true),
                setPendingFilters((prev) => ({
                  ...prev,
                  neighborhood: event.target.value,
                })))
              }
            >
              <option value="all">
                {isCitySelected
                  ? t(locale, { en: "All", ar: "الكل", fr: "Tous" })
                  : t(locale, {
                      en: "Select city first",
                      ar: "اختر المدينة اولا",
                      fr: "Choisissez d'abord une ville",
                    })}
              </option>
              {availableNeighborhoods.map((item, index) => (
                <option key={index} value={item.name}>
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
              value={activeFilters.rooms}
              onChange={(event) =>
                (setIsDraftDirty(true),
                setPendingFilters((prev) => ({
                  ...prev,
                  rooms: event.target.value,
                })))
              }
            >
              <option value="all">
                {t(locale, { en: "All", ar: "الكل", fr: "Tous" })}
              </option>
              {[1, 2, 3, 4, 5].map((room, index) => (
                <option key={index} value={room}>
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
              value={activeFilters.propertyType}
              onChange={(event) =>
                (setIsDraftDirty(true),
                setPendingFilters((prev) => ({
                  ...prev,
                  propertyType: event.target.value,
                })))
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
                en: "Min price",
                ar: "أقل سعر",
                fr: "Prix minimum",
              })}
            </label>
            <Input
              value={activeFilters.minPrice}
              onChange={(event) =>
                (setIsDraftDirty(true),
                setPendingFilters((prev) => ({
                  ...prev,
                  minPrice: event.target.value,
                })))
              }
              inputMode="numeric"
            />
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
              value={activeFilters.maxPrice}
              onChange={(event) =>
                (setIsDraftDirty(true),
                setPendingFilters((prev) => ({
                  ...prev,
                  maxPrice: event.target.value,
                })))
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
            disabled={showLoading}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
          >
            {showLoading ? (
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
        {showLoading && (
          <div className="flex items-center justify-center rounded-2xl border border-border/70 bg-card/70 p-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!showLoading && properties.length > 0 && !isError && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard key={property.id} locale={locale} property={property} />
            ))}
          </div>
        )}

        {!showLoading && properties.length === 0 && !isError && (
          <div className="flex items-center justify-center rounded-2xl border border-border/70 bg-card/70 p-6 text-center text-sm text-muted-foreground">
            {noResults}
          </div>
        )}

        {!showLoading && properties.length > 0 && totalPages > 1 && !isError && (
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
                disabled={currentPage === 1 || showLoading}
              >
                {t(locale, { en: "Previous", ar: "السابق", fr: "Precedent" })}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPageParam(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || showLoading}
              >
                {t(locale, { en: "Next", ar: "التالي", fr: "Suivant" })}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
