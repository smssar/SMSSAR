"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import type { Locale } from "@/lib/locales";

type DodoCheckoutButtonProps = {
  planId: string;
  amount: string;
  planName: string;
  locale: Locale;
};

export function DodoCheckoutButton({
  planId,
  amount,
  planName,
  locale,
}: DodoCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (!planId) {
      toast.error(
        locale === "ar"
          ? "الرجاء اختيار خطة"
          : locale === "fr"
            ? "Veuillez sélectionner un forfait"
            : "Please select a plan",
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/payments/dodo-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Checkout failed");
      }

      const { checkoutUrl } = await response.json();

      if (checkoutUrl) {
        // Redirect to Dodo checkout
        window.location.href = checkoutUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
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
    <Card className="overflow-hidden border-border/70 bg-background/95 shadow-[0_28px_90px_-35px_rgba(15,23,42,0.45)]">
      <CardContent className="space-y-8 p-8 lg:p-10">
        <div className="rounded-3xl border border-border/60 bg-background/50 p-8">
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {locale === "ar"
                  ? "ملخص الطلب"
                  : locale === "fr"
                    ? "Résumé de la commande"
                    : "Order summary"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold">{planName}</h2>
            </div>

            <div className="border-t border-border/60 pt-6">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">
                  {locale === "ar"
                    ? "الإجمالي"
                    : locale === "fr"
                      ? "Total"
                      : "Total"}
                </p>
                <p className="text-3xl font-semibold text-violet-600 dark:text-violet-400">
                  {amount}
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card/70 px-4 py-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                {locale === "ar"
                  ? "مدفوعات آمنة ومشفرة"
                  : locale === "fr"
                    ? "Paiements sécurisés et chiffrés"
                    : "Secure encrypted payments"}
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card/70 px-4 py-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                {locale === "ar"
                  ? "تأكيد فوري"
                  : locale === "fr"
                    ? "Confirmation instantanée"
                    : "Instant confirmation"}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={handleCheckout}
            disabled={isLoading || !planId}
            variant="accent"
            size="lg"
            className="flex-1"
          >
            {isLoading
              ? locale === "ar"
                ? "جاري التوجيه..."
                : locale === "fr"
                  ? "Redirection en cours..."
                  : "Redirecting..."
              : locale === "ar"
                ? "الدفع الآن"
                : locale === "fr"
                  ? "Payer maintenant"
                  : "Pay now"}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Button>

          <Button
            onClick={() => window.history.back()}
            variant="outline"
            size="lg"
            className="flex-1"
            disabled={isLoading}
          >
            {locale === "ar"
              ? "العودة"
              : locale === "fr"
                ? "Retour"
                : "Back"}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {locale === "ar"
            ? "سيتم توجيهك إلى بوابة الدفع الآمنة من Dodo"
            : locale === "fr"
              ? "Vous serez redirigé vers la passerelle de paiement sécurisée de Dodo"
              : "You will be redirected to Dodo's secure payment gateway"}
        </p>
      </CardContent>
    </Card>
  );
}
