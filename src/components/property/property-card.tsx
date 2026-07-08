import {
  ArrowUpRight,
  Bath,
  BedDouble,
  Building2,
  MapPin,
  Ruler,
  Heart,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Media } from "@/generated/prisma/client";
import { formatCurrency } from "@/lib/format";
import type { Locale } from "@/lib/locales";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { FavoriteButton } from "@/components/property/favorite-button";
import ExpandableText from "@/components/ui/expandable-text";
import { getMessages } from "@/lib/messages";

const t = <T extends { en: string; ar: string; fr: string }>(
  locale: Locale,
  text: T,
) => text[locale] ?? text.en;

export interface PropertyCardProps {
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
  ads?: Array<{ id: string }>;
  favoriteCount?: number;
  seller: string;
  media?: Array<Pick<Media, "id" | "url" | "publicId" | "type">>;
  isFavorite?: boolean;
  favoriteEnabled?: boolean;
}

const colorPalettes = [
  ["from-sky-500", "to-indigo-600"],
  ["from-fuchsia-500", "to-violet-600"],
  ["from-emerald-500", "to-teal-600"],
  ["from-amber-500", "to-orange-600"],
  ["from-rose-500", "to-pink-600"],
  ["from-cyan-500", "to-blue-600"],
];

function getColorPalette(id: string): [string, string] {
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colorPalettes[hash % colorPalettes.length] as [string, string];
}

function formatCompactCount(locale: Locale, count?: number) {
  if (typeof count !== "number" || count <= 0) return null;

  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(count);
}

export function PropertyCard({
  locale,
  property,
  favoriteEnabled = true,
}: {
  locale: Locale;
  property: PropertyCardProps;
  favoriteEnabled?: boolean;
}) {
  const palette = getColorPalette(property.id);
  const messages = getMessages(locale);
  const primaryMediaImage = property.media?.find(
    (item) => item.type === "image",
  )?.url;
  const displayImage = property.imageUrl ?? primaryMediaImage;
  const rentLabel =
    property.priceType?.toUpperCase() === "DAILY"
      ? t(locale, {
          en: "Daily rent",
          ar: "الإيجار اليومي",
          fr: "Loyer journalier",
        })
      : t(locale, {
          en: "Monthly rent",
          ar: "الإيجار الشهري",
          fr: "Loyer mensuel",
        });
  const computedAdCount = property.ads?.length ?? 0;
  const favoriteCountLabel = formatCompactCount(locale, property.favoriteCount);
  const adLabel = messages.common.ad;

  return (
    <Card className="group overflow-hidden border-border/70 bg-card transition hover:-translate-y-1 hover:shadow-2xl">
      <div
        className={cn(
          "relative h-56 overflow-hidden bg-linear-to-br",
          palette[0],
          palette[1],
        )}
      >
        {displayImage ? (
          <Image
            src={displayImage}
            alt={`${property.title} in ${property.city}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
            priority={false}
            loading="eager"
            unoptimized
          />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--accent)/0.34),transparent_34%),linear-gradient(180deg,hsl(var(--primary)/0.08),hsl(var(--primary)/0.52))]" />
        <div className="absolute left-4 top-4 flex max-w-[calc(100%-2rem)] flex-wrap items-center gap-2">
          {computedAdCount ? (
            <Badge
              variant="secondary"
              aria-label={`${adLabel}`}
              className="relative flex items-center gap-2 rounded-full px-3 py-1.5 bg-background text font-semibold uppercase tracking-[0.12em] shadow-2xl shadow-violet-600/30 transform transition-all duration-300 hover:scale-105"
            >
              <span className="flex items-center justify-center rounded-full bg-white/20 p-1">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="flex items-baseline gap-1">
                <span className="text-[11px] opacity-95">{adLabel}</span>
              </span>
            </Badge>
          ) : null}
          {/* favorite count moved into card content for improved layout/styling */}
          {property.featured ? (
            <Badge
              variant="accent"
              className="px-3 py-1.5 border-white/15 bg-linear-to-r from-violet-600 via-fuchsia-600 to-indigo-600 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-lg shadow-violet-500/25 backdrop-blur-xl "
            >
              {t(locale, { en: "Featured", ar: "مميز", fr: "En vedette" })}
            </Badge>
          ) : null}
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
          <div>
            <div className="flex items-center gap-2 text-sm/none text-white/85">
              <MapPin className="h-4 w-4" />
              <span>{property.city}</span>
            </div>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">
              {property.title}
            </h3>
          </div>
          <div className="rounded-full bg-white/15 p-3 backdrop-blur">
            <Building2 className="h-5 w-5" />
          </div>
        </div>
      </div>
      <CardContent className="space-y-5 p-6">
        <ExpandableText
          text={property.description}
          maxLength={200}
          locale={locale}
        />

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-linear-to-r from-violet-500/10 via-fuchsia-500/10 to-indigo-500/10 px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm shadow-violet-500/10 dark:text-violet-200">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600/15 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300">
              <Building2 className="h-4 w-4" />
            </span>
            <span className="truncate">{property.propertyType}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <Meta
            icon={<BedDouble className="h-4 w-4" />}
            label={property.rooms.toString()}
            caption={t(locale, { en: "rooms", ar: "غرف", fr: "chambres" })}
          />
          <Meta
            icon={<Bath className="h-4 w-4" />}
            label={property.bathrooms.toString()}
            caption={t(locale, {
              en: "baths",
              ar: "حمامات",
              fr: "salles de bain",
            })}
          />
          <Meta
            icon={<Ruler className="h-4 w-4" />}
            label={`${property.area}`}
            caption={t(locale, { en: "sqm", ar: "م²", fr: "m²" })}
          />
        </div>

        {/* Amenities section removed - not available in real database properties */}

        <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {rentLabel}
            </div>
            <div className="text-xl font-semibold">
              {formatCurrency(property.price, locale)}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <div className="font-medium text-foreground">{property.seller}</div>
            {property.favoriteCount ? (
              <div
                aria-label={
                  locale === "ar"
                    ? `المفضلة ${favoriteCountLabel}`
                    : locale === "fr"
                      ? `${favoriteCountLabel} favoris`
                      : `${favoriteCountLabel} favorites`
                }
                className="mt-1 flex items-center justify-end"
              >
                <span className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-rose-50/40 to-rose-100/10 px-3 py-1 text-sm font-medium text-rose-600 shadow-sm dark:from-rose-900/20 dark:to-rose-900/10">
                  <Heart className="h-4 w-4 text-rose-500" />
                  <span>{favoriteCountLabel}</span>
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center gap-3 p-6 pt-0">
        <ButtonLink
          href={`/${locale}/properties/${property.id}`}
          variant="accent"
          className="flex-1 bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
        >
          {t(locale, {
            en: "View details",
            ar: "عرض التفاصيل",
            fr: "Voir les détails",
          })}
          <ArrowUpRight className="h-4 w-4" />
        </ButtonLink>
        <FavoriteButton
          key={`${property.id}-${property.isFavorite ?? false}`}
          locale={locale}
          propertyId={property.id}
          initialFavorite={property.isFavorite ?? false}
          enabled={favoriteEnabled && (property.favoriteEnabled ?? true)}
          className="h-11 w-11 shrink-0 px-0"
        />
      </CardFooter>
    </Card>
  );
}

function Meta({
  icon,
  label,
  caption,
}: {
  icon: ReactNode;
  label: string;
  caption: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-lg font-semibold text-foreground">{label}</span>
      </div>
      <div className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {caption}
      </div>
    </div>
  );
}
