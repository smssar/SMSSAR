"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import type { Locale } from "@/lib/locales";

type Subscription = {
  id: string;
  userId: string;
  planId: string;
  status: string;
  startDate: Date;
  endDate: Date | null;
  paymentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type PricingCheckoutButtonProps = {
  planId: string;
  locale: Locale;
  featured?: boolean;
  label: string;
  activeSubscription?: Subscription | null;
  scheduledSubscription?: Subscription | null;
};

export function PricingCheckoutButton({
  planId,
  locale,
  featured = false,
  label,
  activeSubscription,
  scheduledSubscription,
}: PricingCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const hasPaidActiveSubscription = Boolean(
    activeSubscription &&
    activeSubscription.planId !== "plan_free" &&
    ["ACTIVE", "WiLL_EXPIRE"].includes(activeSubscription.status),
  );
  const isScheduledForThisPlan =
    scheduledSubscription?.planId === planId &&
    !!scheduledSubscription?.startDate;
  const activeSubscriptionEndDate = activeSubscription?.endDate ?? null;
  const [activationMode, setActivationMode] = useState<
    "immediate" | "scheduled" | null
  >(hasPaidActiveSubscription ? null : "immediate");

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(
      locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );
  };

  const formatTimeRemaining = (date: Date) => {
    const now = new Date();
    const then = new Date(date);
    const diff = then.getTime() - now.getTime();

    if (diff <= 0)
      return locale === "ar"
        ? "قيد التفعيل"
        : locale === "fr"
          ? "En cours d'activation"
          : "Activating";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    if (days > 0)
      return `${days} ${locale === "ar" ? "يوم" : locale === "fr" ? "j" : "d"}${hours > 0 ? ` ${hours}h` : ""}`;
    if (hours > 0)
      return `${hours} ${locale === "ar" ? "ساعة" : locale === "fr" ? "h" : "h"}${minutes > 0 ? ` ${minutes}m` : ""}`;
    return `${minutes} ${locale === "ar" ? "دقيقة" : locale === "fr" ? "m" : "m"}`;
  };

  if (isScheduledForThisPlan && scheduledSubscription) {
    return (
      <div className="space-y-3 animate-in fade-in duration-300">
        <Card className="border-2 border-blue-200/60 bg-linear-to-br from-blue-50/80 to-blue-100/40 p-4 dark:from-blue-950/40 dark:to-blue-900/20">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-1 text-left">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                {locale === "ar"
                  ? "الاشتراك مجدول"
                  : locale === "fr"
                    ? "Abonnement programmé"
                    : "Subscription scheduled"}
              </p>
              <p className="text-sm text-blue-700/90 dark:text-blue-300/90">
                {locale === "ar"
                  ? `سيتم تفعيل الخطة في ${formatDate(scheduledSubscription.startDate)}`
                  : locale === "fr"
                    ? `Le forfait sera activé le ${formatDate(scheduledSubscription.startDate)}`
                    : `Plan activates on ${formatDate(scheduledSubscription.startDate)}`}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {locale === "ar"
                  ? `المتبقي: ${formatTimeRemaining(scheduledSubscription.startDate)}`
                  : locale === "fr"
                    ? `Temps restant : ${formatTimeRemaining(scheduledSubscription.startDate)}`
                    : `Time remaining: ${formatTimeRemaining(scheduledSubscription.startDate)}`}
              </p>
            </div>
          </div>
        </Card>

        <Button
          variant="secondary"
          size="lg"
          className="w-full justify-center"
          disabled
        >
          {locale === "ar"
            ? "مجدول"
            : locale === "fr"
              ? "Programmé"
              : "Scheduled"}
        </Button>
      </div>
    );
  }

  const handleCheckout = async (mode: "immediate" | "scheduled") => {
    if (!planId) return;

    setIsLoading(true);

    try {
      const payload = { planId, activationMode: mode, locale };
      const response = await fetch("/api/payments/plans/dodo-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Checkout failed");
      }

      if (!result.checkoutUrl) {
        throw new Error("Missing checkout URL");
      }

      window.location.href = result.checkoutUrl;
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

  // If no active subscription, show single button
  if (!hasPaidActiveSubscription) {
    return (
      <Button
        onClick={() => handleCheckout("immediate")}
        variant={featured ? "accent" : "outline"}
        size="lg"
        className="w-full justify-center transition-all duration-300 hover:shadow-lg"
        disabled={isLoading}
      >
        {isLoading
          ? locale === "ar"
            ? "جاري التوجيه..."
            : locale === "fr"
              ? "Redirection en cours..."
              : "Redirecting..."
          : label}
      </Button>
    );
  }

  // If user is selecting mode, show options
  if (activationMode === null) {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="rounded-lg bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-4 border border-amber-200/50 dark:border-amber-800/50">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            {locale === "ar"
              ? "لديك خطة نشطة. اختر كيفية تحديثها:"
              : locale === "fr"
                ? "Vous avez un forfait actif. Choisissez comment le mettre à jour :"
                : "You have an active plan. Choose how to upgrade:"}
          </p>
        </div>

        <div className="space-y-3">
          {/* Immediate Option */}
          <button
            onClick={() => setActivationMode("immediate")}
            className="group relative w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-left transition-all duration-300 hover:border-emerald-500/50 hover:shadow-md hover:shadow-emerald-500/10 dark:hover:border-emerald-500/50 cursor-pointer "
          >
            <div className="absolute inset-0 bg-linear-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-50/0 group-hover:via-emerald-50/50 group-hover:to-emerald-50/0 dark:group-hover:from-emerald-950/0 dark:group-hover:via-emerald-950/30 dark:group-hover:to-emerald-950/0 transition-all duration-300" />
            <div className="relative flex items-start gap-3">
              <div className="mt-1 shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {locale === "ar"
                    ? "تفعيل الآن"
                    : locale === "fr"
                      ? "Activer maintenant"
                      : "Activate Now"}
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {locale === "ar"
                    ? "سيتم تفعيل الخطة الجديدة على الفور"
                    : locale === "fr"
                      ? "Le nouveau forfait sera activé immédiatement"
                      : "New plan activates immediately"}
                </p>
              </div>
            </div>
          </button>

          {/* Scheduled Option */}
          <button
            onClick={() => setActivationMode("scheduled")}
            className="group relative w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-left transition-all duration-300 hover:border-blue-500/50 hover:shadow-md hover:shadow-blue-500/10 dark:hover:border-blue-500/50 cursor-pointer "
          >
            <div className="absolute inset-0 bg-linear-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:from-blue-50/0 group-hover:via-blue-50/50 group-hover:to-blue-50/0 dark:group-hover:from-blue-950/0 dark:group-hover:via-blue-950/30 dark:group-hover:to-blue-950/0 transition-all duration-300" />
            <div className="relative flex items-start gap-3">
              <div className="mt-1 shrink-0">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {locale === "ar"
                    ? "حتى انتهاء الخطة الحالية"
                    : locale === "fr"
                      ? "Jusqu'à l'expiration du forfait actuel"
                      : "Until Current Plan Expires"}
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {scheduledSubscription &&
                  scheduledSubscription.planId === planId &&
                  scheduledSubscription.startDate
                    ? locale === "ar"
                      ? `سيتم التفعيل خلال ${formatTimeRemaining(scheduledSubscription.startDate)} — ${formatDate(scheduledSubscription.startDate)}`
                      : locale === "fr"
                        ? `Activation dans ${formatTimeRemaining(scheduledSubscription.startDate)} — ${formatDate(scheduledSubscription.startDate)}`
                        : `Activates in ${formatTimeRemaining(scheduledSubscription.startDate)} — ${formatDate(scheduledSubscription.startDate)}`
                    : activeSubscriptionEndDate
                      ? locale === "ar"
                        ? `سيتم التفعيل في ${formatDate(activeSubscriptionEndDate)}`
                        : locale === "fr"
                          ? `Activation le ${formatDate(activeSubscriptionEndDate)}`
                          : `Activates on ${formatDate(activeSubscriptionEndDate)}`
                      : locale === "ar"
                        ? "سيتم التفعيل لاحقاً"
                        : locale === "fr"
                          ? "Activé ultérieurement"
                          : "Activates later"}
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Show checkout button for selected mode
  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      <Card
        className={`border-2 p-4 transition-all duration-300 ${
          activationMode === "immediate"
            ? "border-emerald-200/60 bg-linear-to-br from-emerald-50/80 to-emerald-100/40 dark:from-emerald-950/40 dark:to-emerald-900/20"
            : "border-blue-200/60 bg-linear-to-br from-blue-50/80 to-blue-100/40 dark:from-blue-950/40 dark:to-blue-900/20"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {activationMode === "immediate" ? (
              <AlertCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <p
            className={`text-sm font-medium ${
              activationMode === "immediate"
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-blue-700 dark:text-blue-300"
            }`}
          >
            {activationMode === "immediate"
              ? locale === "ar"
                ? "سيتم فقدان ايام الخطة المتبقية من الخطة السابقة"
                : locale === "fr"
                  ? "Les jours restants du forfait précédent seront perdus"
                  : "Remaining days of current plan will be forfeited"
              : locale === "ar"
                ? `السعر سيتم احتسابه من ${formatDate(activeSubscriptionEndDate || new Date())}`
                : locale === "fr"
                  ? `Le prix sera facturé à partir du ${formatDate(activeSubscriptionEndDate || new Date())}`
                  : `Charge will start from ${formatDate(activeSubscriptionEndDate || new Date())}`}
          </p>
        </div>
      </Card>

      <Button
        onClick={() => handleCheckout(activationMode)}
        variant={featured ? "accent" : "default"}
        size="lg"
        className={`w-full justify-center font-semibold transition-all duration-300 hover:shadow-lg ${
          activationMode === "immediate"
            ? "hover:shadow-emerald-500/30"
            : "hover:shadow-blue-500/30"
        }`}
        disabled={isLoading}
      >
        {isLoading
          ? locale === "ar"
            ? "جاري التوجيه..."
            : locale === "fr"
              ? "Redirection en cours..."
              : "Redirecting..."
          : label}
      </Button>

      <Button
        onClick={() => setActivationMode(null)}
        variant="ghost"
        size="sm"
        className="w-full text-slate-600 dark:text-slate-400 transition-colors duration-300 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 cursor-pointer "
        disabled={isLoading}
      >
        {locale === "ar"
          ? "← غير الاختيار"
          : locale === "fr"
            ? "← Changer de choix"
            : "← Change selection"}
      </Button>
    </div>
  );
}
