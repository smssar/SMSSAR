"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  Check,
  Zap,
  Image,
  Video,
  List,
  Star,
  Plus,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { Locale } from "@/lib/locales";

export type PurchaseProduct = {
  id: string;
  code: string | null;
  title: string;
  title_ar: string | null;
  title_fr: string | null;
  description: string | null;
  price: number;
  active: boolean;
};

type PurchaseCheckoutClientProps = {
  locale: Locale;
  products: PurchaseProduct[];
};

const purchaseTypeLabel: Record<string, string> = {
  EXTRA_IMAGES: "EXTRA_IMAGES",
  ADS_DURATION_PER_DAY: "ADS_DURATION_PER_DAY",
  EXTRA_VIDEOS: "EXTRA_VIDEOS",
  EXTRA_LISTINGS: "EXTRA_LISTINGS",
  EXTRA_FEATURED_LISTINGS: "EXTRA_FEATURED_LISTINGS",
  ADSNUMBERS: "ADSNUMBERS",
};

const iconMap: Record<string, typeof Zap> = {
  EXTRA_IMAGES: Image,
  EXTRA_VIDEOS: Video,
  EXTRA_LISTINGS: List,
  EXTRA_FEATURED_LISTINGS: Star,
  ADS_DURATION_PER_DAY: Zap,
  default: Zap,
};

export function PurchaseCheckoutClient({
  locale,
  products,
}: PurchaseCheckoutClientProps) {
  const router = useRouter();

  const pathname = usePathname();
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);

  const selectedProducts = useMemo(
    () =>
      products.filter((p) => selectedItems[p.id] && selectedItems[p.id] > 0),
    [products, selectedItems],
  );

  const localizedTitle = (product: PurchaseProduct) =>
    locale === "ar"
      ? product.title_ar || product.title
      : locale === "fr"
        ? product.title_fr || product.title
        : product.title;

  const getProductIcon = (code: string) => {
    return iconMap[code] || iconMap.default;
  };

  const totalPrice = selectedProducts.reduce((sum, product) => {
    return sum + product.price * (selectedItems[product.id] || 0);
  }, 0);

  const toggleProductSelection = (productId: string) => {
    setSelectedItems((prev) => {
      const newItems = { ...prev };
      if (newItems[productId]) {
        delete newItems[productId];
      } else {
        newItems[productId] = 1;
      }
      return newItems;
    });
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setSelectedItems((prev) => ({
      ...prev,
      [productId]: Math.max(1, quantity),
    }));
  };

  const handleQuantityIncrease = (productId: string) => {
    handleQuantityChange(productId, (selectedItems[productId] || 0) + 1);
  };

  const handleQuantityDecrease = (productId: string) => {
    const current = selectedItems[productId] || 0;
    if (current > 1) {
      handleQuantityChange(productId, current - 1);
    }
  };

  const handleCheckout = async () => {
    if (selectedProducts.length === 0) {
      toast.error(
        locale === "ar"
          ? "الرجاء اختيار إضافة واحدة على الأقل"
          : locale === "fr"
            ? "Veuillez sélectionner au moins une option"
            : "Please select at least one add-on",
      );
      return;
    }

    setIsLoading(true);

    try {
      const purchases = selectedProducts.map((product) => ({
        type: product.code
          ? (purchaseTypeLabel[product.code] ?? product.code)
          : "UNKNOWN",
        quantity: selectedItems[product.id] || 1,
      }));

      const response = await fetch("/api/payments/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          returnTo: pathname,
          purchases,
          amount: totalPrice,
          selectedProductIds: selectedProducts.map((p) => p.id),
          selectedProductNames: selectedProducts.map((p) => localizedTitle(p)),
        }),
      });

      if (!response.ok) {
        const result = (await response.json()) as {
          error?: string;
          loginUrl?: string;
        };

        if (response.status === 401 && result.loginUrl) {
          router.push(result.loginUrl);
          return;
        }

        throw new Error(result.error || "Checkout failed");
      }

      const result = (await response.json()) as { checkoutUrl?: string };

      if (!result.checkoutUrl) {
        throw new Error("Missing checkout URL");
      }

      router.push(result.checkoutUrl);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : locale === "ar"
            ? "حدث خطأ أثناء إنشاء جلسة الدفع"
            : locale === "fr"
              ? "Une erreur s'est produite lors de la création de la session de paiement"
              : "Failed to create checkout session",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Products Grid */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">
          {locale === "ar"
            ? "اختر الإضافة"
            : locale === "fr"
              ? "Choisissez une option"
              : "Select Add-on"}
        </h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const isSelected = !!selectedItems[product.id];
            const IconComponent = getProductIcon(product.code ?? "default");
            return (
              <div
                key={product.id}
                onClick={() => toggleProductSelection(product.id)}
                className={`cursor-pointer group relative rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-blue-500 bg-linear-to-br from-blue-50/50 to-blue-100/30 shadow-lg dark:from-blue-950/30 dark:to-blue-900/20"
                    : "border-border/70 bg-background/50 hover:border-border hover:bg-muted/40 dark:bg-transparent"
                }`}
              >
                {/* Selection Checkbox */}
                <div className="absolute -right-2 -top-2">
                  <button
                    type="button"
                    className={`rounded-full p-1 transition-colors ${
                      isSelected
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Icon & Title */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`rounded-xl p-2.5 ${
                          isSelected
                            ? "bg-blue-500/20 text-blue-600 dark:bg-blue-400/20 dark:text-blue-400"
                            : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                        }`}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <div
                          className={`font-semibold leading-tight ${
                            isSelected
                              ? "text-foreground"
                              : "text-foreground/80"
                          }`}
                        >
                          {localizedTitle(product)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {product.description && (
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </div>
                  )}

                  {/* Price */}
                  <div
                    className={`flex items-baseline justify-between border-t pt-3 ${
                      isSelected ? "border-blue-200/30" : "border-border/30"
                    }`}
                  >
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {locale === "ar"
                        ? "السعر"
                        : locale === "fr"
                          ? "Prix"
                          : "Price"}
                    </span>
                    <span
                      className={`text-lg font-bold ${
                        isSelected
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-foreground"
                      }`}
                    >
                      {formatCurrency(product.price, locale)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Summary */}
      {selectedProducts.length > 0 && (
        <Card className="border-border/70 bg-linear-to-br from-slate-50 to-slate-100/50 shadow-sm dark:from-slate-950/50 dark:to-slate-900/30">
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">
                {locale === "ar"
                  ? "ملخص الطلب"
                  : locale === "fr"
                    ? "Résumé de la commande"
                    : "Order Summary"}
              </h3>

              {/* Selected Products List */}
              <div className="space-y-3 border-b border-border/50 pb-4">
                {selectedProducts.map((product) => (
                  <div key={product.id} className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-medium text-foreground">
                          {localizedTitle(product)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(product.price, locale)} ×{" "}
                          {selectedItems[product.id]}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuantityDecrease(product.id)}
                          disabled={isLoading}
                          className="cursor-pointer rounded p-1 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-foreground">
                          {selectedItems[product.id]}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityIncrease(product.id)}
                          disabled={isLoading}
                          className="cursor-pointer rounded p-1 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between rounded-lg bg-white/40 px-2 py-1.5 text-sm dark:bg-black/20">
                      <span className="text-muted-foreground">
                        {locale === "ar"
                          ? "الإجمالي"
                          : locale === "fr"
                            ? "Sous-total"
                            : "Subtotal"}
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(
                          product.price * selectedItems[product.id],
                          locale,
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Price */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {locale === "ar"
                      ? "المجموع النهائي"
                      : locale === "fr"
                        ? "Total final"
                        : "Final Total"}
                  </span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(totalPrice, locale)}
                    </div>
                  </div>
                </div>
                {/* No Extra Fees Indicator */}
                <div className="flex items-center justify-between rounded-lg bg-white/40 px-3 py-2 text-xs text-muted-foreground dark:bg-black/20">
                  <span>
                    {locale === "ar"
                      ? "السعر النهائي بدون رسوم إضافية"
                      : locale === "fr"
                        ? "Prix final sans frais supplémentaires"
                        : "Final price with no extra fees"}
                  </span>
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Button */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={handleCheckout}
          disabled={isLoading || selectedProducts.length === 0}
          size="lg"
          className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin rtl:rotate-180" />
              <span>
                {locale === "ar"
                  ? "جاري التوجيه..."
                  : locale === "fr"
                    ? "Redirection en cours..."
                    : "Redirecting..."}
              </span>
            </>
          ) : (
            <>
              <span>
                {locale === "ar"
                  ? `ادفع الآن (${selectedProducts.length})`
                  : locale === "fr"
                    ? `Payer maintenant (${selectedProducts.length})`
                    : `Pay Now (${selectedProducts.length})`}
              </span>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
