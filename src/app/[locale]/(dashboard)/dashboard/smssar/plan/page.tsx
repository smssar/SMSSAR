import { Check, Crown, ShoppingBag } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { getMessages } from "@/lib/messages";
import { plans as planFeatures } from "@/lib/site-data";
import { prisma } from "@/lib/prisma";
import {
  getActiveSubscription,
  getScheduledSubscription,
} from "@/lib/getActiveSubscription";
import { PricingCheckoutButton } from "@/components/payment/pricing-checkout-button";
import type { Locale } from "@/lib/locales";
import { formatCurrency } from "@/lib/format";
import { resolvePlanForRole } from "@/lib/role-pricing";

export default async function SmssarPlanPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const messages = getMessages(locale);
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  if (session.user.role !== "SELLER" && session.user.role !== "SMSSAR") {
    redirect(`/${locale}/dashboard/profile`);
  }

  const seller = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { planId: true },
  });

  const currentPlanId = seller?.planId ?? session.user.planId ?? "plan_free";

  const plans = await prisma.plan.findMany({
    orderBy: { price: "asc" },
  });

  const effectivePlans = plans.map((plan) =>
    resolvePlanForRole(plan, session.user.role),
  );

  const currentPlan =
    effectivePlans.find((plan) => plan.id === currentPlanId) ?? null;
  const visiblePlans =
    currentPlanId === "plan_free"
      ? effectivePlans
      : effectivePlans.filter((plan) => plan.id !== "plan_free");

  const activeSubscription = await getActiveSubscription(session.user.id);
  const scheduledSubscription = await getScheduledSubscription(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {messages.dashboard.seller.plan}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {locale === "ar"
            ? "اختر الباقة المناسبة لعدد العقارات الذي تديره."
            : "Choose the right plan for your listing volume."}
        </p>
      </div>

      {currentPlan ? (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <div className="text-sm text-muted-foreground">
                {locale === "ar" ? "الباقة الحالية" : "Current plan"}
              </div>
              <div className="text-xl font-semibold">
                {locale === "ar"
                  ? currentPlan.title_ar || currentPlan.title
                  : locale === "fr"
                    ? currentPlan.title_fr || currentPlan.title
                    : currentPlan.title}
              </div>
            </div>
            <Badge variant="secondary" className="border-emerald-600/30">
              {locale === "ar" ? "نشطة" : "Active"}
            </Badge>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        {visiblePlans.map((plan) => {
          const featureSet = planFeatures.find((item) => item.id === plan.id);
          const isCurrentPlan = plan.id === currentPlanId;

          return (
            <Card
              key={plan.id}
              className={
                isCurrentPlan
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : plan.featured
                    ? "border-violet-500/30 bg-violet-500/5"
                    : "border-border/70"
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {plan.featured ? (
                    <Crown className="h-4 w-4 text-violet-500" />
                  ) : null}
                  {locale === "ar"
                    ? plan.title_ar || plan.title
                    : locale === "fr"
                      ? plan.title_fr || plan.title
                      : plan.title}
                </CardTitle>
                {isCurrentPlan ? (
                  <Badge
                    variant="secondary"
                    className="w-fit border-emerald-600/30"
                  >
                    {locale === "ar" ? "الباقة الحالية" : "Current plan"}
                  </Badge>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-4xl font-semibold">
                  {plan.price === 0
                    ? locale === "ar"
                      ? "مجاني"
                      : "Free"
                    : formatCurrency(plan.price, locale)}
                </div>
                <div className="space-y-3">
                  {(featureSet?.features ?? []).map((feature, index) => (
                    <div
                      key={`${plan.id}-feature-${index}`}
                      className="flex items-center gap-3 text-sm text-muted-foreground"
                    >
                      <Check className="h-4 w-4 text-violet-500" />
                      {feature[locale]}
                    </div>
                  ))}
                </div>
                {isCurrentPlan ? (
                  <ButtonLink
                    href={`/${locale}/pricing`}
                    variant="default"
                    className="w-full"
                  >
                    {locale === "ar" ? "باقتك الحالية" : "Your current plan"}
                  </ButtonLink>
                ) : (
                  <PricingCheckoutButton
                    planId={plan.id}
                    locale={locale}
                    featured={plan.featured}
                    label={
                      locale === "ar"
                        ? "اشترك"
                        : locale === "fr"
                          ? "S'abonner"
                          : "Subscribe"
                    }
                    activeSubscription={activeSubscription}
                    scheduledSubscription={scheduledSubscription}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-emerald-500/40 bg-linear-to-br from-emerald-500/5 to-teal-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-6 w-6 text-emerald-600" />
            <div>
              <CardTitle>
                {locale === "ar" ? "شراء الإضافات" : "Purchase Add-ons"}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {locale === "ar"
                  ? "عزز قائمتك بميزات وأدوات إضافية"
                  : "Boost your listings with premium features"}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {locale === "ar"
              ? "اشتر صور إضافية وفيديوهات وإعلانات وقوائم مميزة حسب احتياجاتك"
              : "Add extra images, videos, ads, and featured listings on demand"}
          </p>
          <ButtonLink
            href={`/${locale}/dashboard/smssar/purchases`}
            variant="default"
            className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
          >
            <ShoppingBag className="h-4 w-4" />
            {locale === "ar" ? "اذهب للشراء" : "Shop Now"}
          </ButtonLink>
        </CardContent>
      </Card>
    </div>
  );
}
