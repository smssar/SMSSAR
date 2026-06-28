/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CancelButton from "@/components/seller/cancel-subscription-button";

type Props = { params: Promise<{ locale: Locale }> };

export default async function SmssarBillingPage({ params }: Props) {
  const { locale } = await params;
  const messages = getMessages(locale);

  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);
  if (session.user.role !== "SELLER" && session.user.role !== "SMSSAR")
    redirect(`/${locale}/dashboard/profile`);

  const active = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
    },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  // Also check for a subscription that is scheduled to expire (WiLL_EXPIRE)
  const isWillExpire = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: "WiLL_EXPIRE",
    },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  // Treat either active or will-expire as the current subscription to display
  const current = active ?? isWillExpire;
  const willExpire = (current?.status ?? null) === "WiLL_EXPIRE";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">
          {messages.pricing.currentPlan}
        </h1>
        <p className="text-muted-foreground mt-2">
          {messages.pricing.currentPlanHelp}
        </p>
      </div>

      {!current ? (
        <Card>
          <CardHeader>
            <CardTitle>{messages.dashboard.seller.plan}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-4 text-sm text-foreground">
              You are on the free plan.
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-3">
                  <span className="text-lg">
                    {getPlanTitle(current?.plan, locale)}
                  </span>
                </CardTitle>
                <div className="text-sm text-muted-foreground mt-1">
                  {current?.plan?.description ?? ""}
                </div>
                {willExpire && current?.endDate ? (
                  <div className="mt-3 flex items-center gap-4">
                    <div className="rounded-md bg-amber-50/60 px-3 py-2 text-2xl font-semibold text-amber-700">
                      {timeUntil(current.endDate)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {locale === "ar"
                        ? "ستنتهي باقتك الحالية خلال"
                        : "Your current plan expires in"}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col items-end gap-2">
                <Badge
                  variant={statusVariant(current?.status ?? "")}
                  className="uppercase"
                >
                  {willExpire
                    ? `${locale === "ar" ? "ستنتهي قريباً" : "Will expire"}`
                    : current?.status}
                </Badge>
                {current?.startDate && current?.endDate ? (
                  <div className="w-40 mt-2">
                    <div className="h-2 w-full rounded-full bg-border/50">
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{
                          width: `${progressPercent(current.startDate, current.endDate)}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 text-right">
                      {formatDate(current.startDate, locale)} —{" "}
                      {formatDate(current.endDate, locale)}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-muted-foreground">
                {messages.common.start}
              </div>
              <div className="font-medium">
                {formatDate(current?.startDate, locale)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">{messages.common.end}</div>
              <div className="font-medium">
                {formatDate(current?.endDate, locale)}
                {willExpire && current?.endDate ? (
                  <div className="text-sm text-muted-foreground">{` (${timeUntil(current.endDate)} left)`}</div>
                ) : null}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">
                {messages.common.payment}
              </div>
              <div className="font-medium wrap-break-word">
                {current?.paymentId ?? "-"}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">
                {messages.common.created}
              </div>
              <div className="font-medium">
                {formatDate(current?.createdAt, locale)}
              </div>
            </div>

            <div className="pt-4 col-span-full flex justify-end">
              {active && current?.plan?.id !== "plan_free" ? (
                <CancelButton
                  label={messages.common.cancel}
                  confirmMessage={messages.dashboard.seller.confirmCancel}
                  successMessage={
                    locale === "ar"
                      ? "تم إلغاء الاشتراك بنجاح. ستبقى الباقة مفعلة حتى تاريخ الانتهاء."
                      : locale === "fr"
                        ? "Abonnement annule avec succes. Le forfait reste actif jusqu'a la date d'expiration."
                        : "Subscription CANCELLED successfully. Your plan stays active until the end date."
                  }
                  errorMessage={
                    locale === "ar"
                      ? "تعذر إلغاء الاشتراك. حاول مرة أخرى."
                      : locale === "fr"
                        ? "Impossible d'annuler l'abonnement. Veuillez reessayer."
                        : "Failed to cancel subscription. Please try again."
                  }
                  confirmTitle={
                    locale === "ar"
                      ? "تأكيد إلغاء الاشتراك"
                      : locale === "fr"
                        ? "Confirmer l'annulation"
                        : "Confirm cancellation"
                  }
                  cancelActionLabel={
                    locale === "ar"
                      ? "الاحتفاظ بالاشتراك"
                      : locale === "fr"
                        ? "Conserver l'abonnement"
                        : "Keep subscription"
                  }
                  confirmActionLabel={
                    locale === "ar"
                      ? "إلغاء الاشتراك"
                      : locale === "fr"
                        ? "Annuler l'abonnement"
                        : "Cancel subscription"
                  }
                />
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function progressPercent(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined,
) {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const now = Date.now();
  if (e <= s) return 100;
  const pct = ((now - s) / (e - s)) * 100;
  if (pct < 0) return 0;
  if (pct > 100) return 100;
  return Math.round(pct);
}

function getPlanTitle(plan: any, locale: string) {
  if (!plan) return "";
  if (locale === "ar") return plan.title_ar ?? plan.title;
  if (locale === "fr") return plan.title_fr ?? plan.title;
  return plan.title;
}

function formatDate(date: string | Date | null | undefined, locale: string) {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return new Date(date).toLocaleDateString(undefined);
  }
}

function timeUntil(date: string | Date | null | undefined) {
  if (!date) return "-";
  const then = new Date(date).getTime();
  const now = Date.now();
  const diff = then - now;
  if (diff <= 0) return "expired";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;

  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes} minute${minutes > 1 ? "s" : ""}`;
}

function statusVariant(status: string) {
  switch (status) {
    case "ACTIVE":
      return "accent";
    case "CANCELLED":
      return "secondary";
    case "WiLL_EXPIRE":
      return "secondary";
    case "EXPIRED":
      return "outline";
    default:
      return "default";
  }
}
