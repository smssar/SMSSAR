"use client";

import { useState } from "react";
import { Trash2, Loader2, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SellerPropertyCard } from "@/components/seller/seller-property-card";
import type { Locale } from "@/lib/locales";

type Property = {
  id: string;
  title: string;
  description?: string | null;
  city: string;
  area?: number | null;
  rooms: number;
  bathrooms?: number | null;
  price: number;
  featured: boolean;
  imageUrl?: string | null;
  propertyType?: {
    id: string;
    name: string;
    slug?: string | null;
  } | null;
  amenities?: Array<Record<string, string>>;
  seller?: {
    id: string;
    name: string;
    email: string;
  } | null;
  rating?: number;
  palette?: string[];
};

type PendingActionType = {
  type: "delete";
  id: string;
  title: string;
} | null;

export function SellerListingsPanel({
  locale,
  properties,
}: {
  locale: Locale;
  properties: Property[];
}) {
  const [items, setItems] = useState(properties);
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingActionType>(null);

  const handleDeleteClick = (id: string, title: string) => {
    setPendingAction({
      type: "delete",
      id,
      title,
    });
  };

  const performDelete = async () => {
    if (!pendingAction || pendingAction.type !== "delete") return;

    setLoading(true);
    try {
      const response = await fetch(`/api/properties/${pendingAction.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || `Status ${response.status}`);
      }

      setItems((prev) => prev.filter((p) => p.id !== pendingAction.id));
      setPendingAction(null);

      toast.success(locale === "ar" ? "تم حذف العقار." : "Listing deleted.");
    } catch (error) {
      console.error("Failed to delete listing:", error);
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred.",
      );
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-2">
        {items.map((property) => (
          <SellerPropertyCard
            key={property.id}
            locale={locale}
            property={{
              id: property.id,
              title: property.title,
              description: property.description ?? "",
              city: property.city,
              area: property.area ?? null,
              rooms: property.rooms,
              bathrooms: property.bathrooms ?? null,
              price: property.price,
              featured: property.featured,
              imageUrl: property.imageUrl ?? null,
              propertyType: property.propertyType?.name ?? "other",
              amenities: property.amenities ?? [],
              seller: property.seller?.name ?? "",
              rating: property.rating ?? 0,
              palette: property.palette ?? [],
            }}
            onDelete={handleDeleteClick}
          />
        ))}
      </div>

      {pendingAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border/70 bg-card p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400">
              <AlertCircle className="h-6 w-6" />
            </div>

            <h2 className="text-2xl font-semibold tracking-tight">
              {locale === "ar" ? "تأكيد الحذف" : "Confirm delete"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {locale === "ar"
                ? `هل تريد حذف "${pendingAction.title}"؟`
                : `Do you want to delete "${pendingAction.title}"?`}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPendingAction(null)}
                className="gap-2"
                disabled={loading}
              >
                <X className="h-4 w-4" />
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  void performDelete();
                }}
                className="gap-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {locale === "ar" ? "جارٍ الحذف..." : "Deleting..."}
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    {locale === "ar" ? "حذف" : "Delete"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
