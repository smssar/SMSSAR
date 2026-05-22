import {
  Bath,
  BedDouble,
  Building2,
  Eye,
  MapPin,
  Ruler,
  Pencil,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import type { Locale } from "@/lib/locales";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const t = <T extends { en: string; ar: string; fr: string }>(
  locale: Locale,
  text: T,
) => text[locale] ?? text.en;

type Property = {
  id: string;
  title: string | Record<string, string>;
  description?: string | Record<string, string> | null;
  city: string | Record<string, string>;
  area?: number | null;
  rooms: number;
  bathrooms?: number | null;
  price: number;
  featured: boolean;
  imageUrl?: string | null;
  propertyType?: string;
  amenities?: Array<Record<string, string>>;
  seller?: string;
  palette?: string[];
};

export function SellerPropertyCard({
  locale,
  property,
  onDelete,
  className,
}: {
  locale: Locale;
  property: Property;
  onDelete: (id: string, title: string) => void;
  className?: string;
}) {
  const titleText =
    typeof property.title === "string"
      ? property.title
      : property.title[locale];
  const cityText =
    typeof property.city === "string" ? property.city : property.city[locale];
  const descText =
    typeof property.description === "string"
      ? property.description
      : (property.description?.[locale] ?? "");

  return (
    <Card
      className={cn(
        "group w-full overflow-hidden border-border/70 bg-card transition hover:-translate-y-1 hover:shadow-2xl",
        className,
      )}
    >
      <div
        className={cn(
          "relative h-48 overflow-hidden bg-linear-to-br sm:h-56",
          property.palette?.[0],
          property.palette?.[1],
        )}
      >
        {property.imageUrl ? (
          <Image
            src={property.imageUrl}
            alt={titleText}
            fill
            sizes="(max-width: 700px) 100vw, (max-width: 1280px) 30vw, 20vw"
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
              <span>{cityText}</span>
            </div>
            <h3 className="mt-2 text-lg font-semibold tracking-tight sm:text-2xl">
              {titleText}
            </h3>
          </div>
          <div className="rounded-full bg-white/15 p-2.5 backdrop-blur sm:p-3">
            <Building2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      <CardContent className="space-y-5 p-4 sm:p-6">
        <p className="text-sm leading-6 text-muted-foreground">{descText}</p>

        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <Meta
            icon={<BedDouble className="h-4 w-4" />}
            label={String(property.rooms)}
            caption={t(locale, { en: "rooms", ar: "غرف", fr: "chambres" })}
          />
          <Meta
            icon={<Bath className="h-4 w-4" />}
            label={String(property.bathrooms ?? 0)}
            caption={t(locale, {
              en: "baths",
              ar: "حمامات",
              fr: "salles de bain",
            })}
          />
          <Meta
            icon={<Ruler className="h-4 w-4" />}
            label={`${property.area ?? 0}`}
            caption={t(locale, { en: "sqm", ar: "م²", fr: "m²" })}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(property.amenities ?? []).slice(0, 3).map((amenity, i) => (
            <Badge key={i} variant="outline" className="bg-muted/40">
              {amenity[locale]}
            </Badge>
          ))}
        </div>

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
            <div className="font-medium text-foreground">
              {property.seller ?? ""}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 p-4 pt-0 sm:flex-row sm:p-6 sm:pt-0">
        <Link
          href={`/${locale}/properties/${property.id}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border/80 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground sm:w-auto"
          rel="noopener noreferrer"
        >
          <Eye className="h-4 w-4" />
          {t(locale, { en: "View", ar: "عرض", fr: "Voir" })}
        </Link>

        <Link
          href={`/${locale}/dashboard/seller/listings/${property.id}/edit`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border/80 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground sm:w-auto"
        >
          <Pencil className="h-4 w-4" />
          {t(locale, { en: "Edit", ar: "تعديل", fr: "Modifier" })}
        </Link>

        <button
          type="button"
          onClick={() =>
            onDelete(
              property.id,
              typeof property.title === "string"
                ? property.title
                : property.title[locale],
            )
          }
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-red-500/20 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-500/10 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 sm:w-auto"
        >
          <Trash2 className="h-4 w-4" />
          {t(locale, { en: "Delete", ar: "حذف", fr: "Supprimer" })}
        </button>
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
    <div className="rounded-2xl border border-border/70 bg-background p-3 text-center sm:text-left">
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
