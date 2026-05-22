import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/layout/section-heading";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";
import {
  getActiveSubscription,
  getScheduledSubscription,
} from "@/lib/getActiveSubscription";

const t = <T extends { en: string; ar: string; fr: string }>(
  locale: Locale,
  text: T,
) => text[locale] ?? text.en;

export default async function CheckPlanPage({
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

  const subscription = await getActiveSubscription(session.user.id);
  const scheduledSubscription = await getScheduledSubscription(session.user.id);

  if (subscription && subscription.planId !== "plan_free") {
    redirect(`/${locale}/dashboard`);
  }

  // Format date for display
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

  const planLabel =
    locale === "ar"
      ? "تم تحويل حسابك إلى الخطة المجانية"
      : locale === "fr"
        ? "Votre compte a été basculé vers le forfait gratuit"
        : "Your account has been moved to the free plan";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-16 sm:px-6 lg:px-8">
      <Card className="w-full border-border/70 shadow-lg">
        <CardContent className="space-y-8 p-8 text-center">
          <SectionHeading
            eyebrow={t(locale, {
              en: "Plan check",
              ar: "التحقق من الخطة",
              fr: "Vérification du forfait",
            })}
            title={t(locale, {
              en: "Subscription expired",
              ar: "انتهت مدة الاشتراك",
              fr: "Abonnement expiré",
            })}
            description={planLabel}
          />

          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-800 dark:text-amber-200">
            {scheduledSubscription ? (
              <div>
                <div className="mb-3 font-medium">
                  {t(locale, {
                    en: `Your renewal to ${scheduledSubscription.plan.title} plan is scheduled for ${formatDate(scheduledSubscription.startDate)}`,
                    ar: `تم جدولة تجديدك إلى خطة ${scheduledSubscription.plan.title_ar || scheduledSubscription.plan.title} في ${formatDate(scheduledSubscription.startDate)}`,
                    fr: `Votre renouvellement au forfait ${scheduledSubscription.plan.title_fr || scheduledSubscription.plan.title} est prévu pour ${formatDate(scheduledSubscription.startDate)}`,
                  })}
                </div>
                {t(locale, {
                  en: "Until then, you can use the free plan with limited features.",
                  ar: "حتى ذلك الحين، يمكنك استخدام الخطة المجانية مع ميزات محدودة.",
                  fr: "En attendant, vous pouvez utiliser le forfait gratuit avec des fonctionnalités limitées.",
                })}
              </div>
            ) : (
              t(locale, {
                en: "We checked your subscription again. Since it is expired, your plan was changed to Free.",
                ar: "تمت إعادة التحقق من اشتراكك. وبما أنه منتهي، تم تغيير خطتك إلى المجانية.",
                fr: "Nous avons revérifié votre abonnement. Comme il est expiré, votre forfait a été changé en gratuit.",
              })
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <ButtonLink href={`/${locale}/pricing`} variant="accent" size="lg">
              {messages.pricing.getPlan}
            </ButtonLink>
            <ButtonLink
              href={`/${locale}/dashboard`}
              variant="outline"
              size="lg"
            >
              {locale === "ar"
                ? "العودة إلى لوحة التحكم"
                : locale === "fr"
                  ? "Retour au tableau de bord"
                  : "Back to dashboard"}
            </ButtonLink>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
