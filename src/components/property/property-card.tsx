import {
  ArrowUpRight,
  Bath,
  BedDouble,
  Building2,
  MapPin,
  Ruler,
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
  propertyType: string;
  featured: boolean;
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
  const primaryMediaImage = property.media?.find(
    (item) => item.type === "image",
  )?.url;
  const displayImage = property.imageUrl ?? primaryMediaImage;

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
            unoptimized
          />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.38),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.46))]" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          {property.featured ? (
            <Badge variant="accent">
              {t(locale, { en: "Featured", ar: "مميز", fr: "En vedette" })}
            </Badge>
          ) : null}
          <Badge variant="secondary" className="bg-background/90 backdrop-blur">
            {property.propertyType}
          </Badge>
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
        <p className="text-sm leading-6 text-muted-foreground">
          {property.description}
        </p>

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
              {t(locale, {
                en: "Monthly rent",
                ar: "الإيجار الشهري",
                fr: "Loyer mensuel",
              })}
            </div>
            <div className="text-xl font-semibold">
              {formatCurrency(property.price, locale)}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <div className="font-medium text-foreground">{property.seller}</div>
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
