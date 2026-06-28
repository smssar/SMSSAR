import { Check } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/layout/section-heading";
import { plans as planFeatures } from "@/lib/site-data";
import { getMessages } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/locales";
import { Badge } from "@/components/ui/badge";
import { PricingCheckoutButton } from "@/components/payment/pricing-checkout-button";
import {
  getActiveSubscription,
  getScheduledSubscription,
} from "@/lib/getActiveSubscription";
import { formatCurrency } from "@/lib/format";
import { resolvePlanForRole } from "@/lib/role-pricing";

export const dynamic = "force-dynamic";

type Plan = {
  id: string;
  title: string;
  title_ar: string | null;
  title_fr: string | null;
  description: string;
  description_ar: string | null;
  description_fr: string | null;
  price: number;
  featured: boolean;
};

const t = <T extends { en: string; ar: string; fr: string }>(
  locale: Locale,
  text: T,
) => text[locale] ?? text.en;

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const messages = getMessages(locale);
  let session = null;
  try {
    session = await auth();
  } catch (error) {
    session = null;
  }
  const plans = await prisma.plan.findMany({ orderBy: { price: "asc" } });
  let currentPlanId: string | null = null;
  let activeSubscription = null;
  let scheduledSubscription = null;

  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { planId: true },
    });
    currentPlanId = dbUser?.planId ?? null;

    activeSubscription = await getActiveSubscription(session.user.id);

    scheduledSubscription = await getScheduledSubscription(session.user.id);
  }

  const effectivePlans = plans.map((plan) =>
    resolvePlanForRole(plan, session?.user?.role),
  );

  const visiblePlans =
    currentPlanId && currentPlanId !== "plan_free"
      ? effectivePlans.filter((plan) => plan.id !== "plan_free")
      : effectivePlans;

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow={t(locale, {
          en: "Seller plans",
          ar: "الخطط الاشتراكية",
          fr: "Forfaits vendeur",
        })}
        title={messages.pricing.title}
        description={messages.pricing.subtitle}
      />
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {visiblePlans.map((plan) => {
          const featureSet = planFeatures.find((item) => item.id === plan.id);
          const isCurrentPlan = currentPlanId === plan.id;

          return (
            <Card
              key={plan.id}
              className={
                isCurrentPlan
                  ? "border-emerald-500/40 bg-emerald-500/5 shadow-xl"
                  : plan.featured
                    ? "border-violet-500/30 bg-violet-500/5 shadow-xl"
                    : "border-border/70"
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>
                    {locale === "ar"
                      ? plan.title_ar || plan.title
                      : locale === "fr"
                        ? plan.title_fr || plan.title
                        : plan.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {isCurrentPlan ? (
                      <Badge
                        variant="secondary"
                        className="border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      >
                        {messages.pricing.currentPlanTag}
                      </Badge>
                    ) : null}
                    {plan.featured ? (
                      <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-600 dark:text-violet-300">
                        {t(locale, {
                          en: "Most popular",
                          ar: "الأكثر طلباً",
                          fr: "Le plus populaire",
                        })}
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {locale === "ar"
                    ? plan.description_ar || plan.description
                    : locale === "fr"
                      ? plan.description_fr || plan.description
                      : plan.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="text-4xl font-semibold">
                  {plan.price === 0
                    ? t(locale, { en: "Free", ar: "مجاني", fr: "Gratuit" })
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
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    disabled
                  >
                    {messages.pricing.currentPlan}
                  </Button>
                ) : (
                  <PricingCheckoutButton
                    planId={plan.id}
                    locale={locale}
                    featured={plan.featured}
                    label={messages.pricing.getPlan}
                    activeSubscription={activeSubscription}
                    scheduledSubscription={scheduledSubscription}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
