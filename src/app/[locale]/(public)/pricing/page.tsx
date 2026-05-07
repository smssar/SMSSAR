import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/layout/section-heading";
import { plans as planFeatures } from "@/lib/site-data";
import { getMessages } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/locales";

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
  const plans = await prisma.plan.findMany({
    orderBy: { price: "asc" },
  });

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
        {plans.map((plan) => {
          const featureSet = planFeatures.find((item) => item.id === plan.id);

          return (
            <Card
              key={plan.id}
              className={
                plan.featured
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
                    : `${plan.price} DH`}
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
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
