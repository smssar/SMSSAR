import Link from "next/link";
import { ArrowRight, BadgeCheck, Search, Shield, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/section-heading";
import { StatGrid } from "@/components/dashboard/stat-grid";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNavbar } from "@/components/layout/site-navbar";
import { AnimatedHeroText } from "@/components/animated-hero-text";
import { SectionReveal } from "@/components/ui/section-reveal";
import {
  properties,
  propertyTypes as fallbackPropertyTypes,
  stats,
  testimonials,
  plans as fallbackPlans,
} from "@/lib/site-data";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";
import { formatCurrency } from "@/lib/format";
import { PropertyCard } from "@/components/property";
import { BecomeSellerButton } from "@/components/auth/become-seller-button";

const t = <T extends { en: string; ar?: string; fr?: string }>(
  locale: Locale,
  text: T,
) => (text[locale as keyof T] ?? text.en) as string;

export default async function LandingPage({ locale }: { locale: Locale }) {
  const messages = getMessages(locale);
  const [{ prisma }, { auth }] = await Promise.all([
    import("@/lib/prisma"),
    import("@/auth"),
  ]);

  const session = await auth();
  const [propertyTypesResult, plansResult] = await Promise.allSettled([
    prisma.propertyType.findMany({
      take: 3,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { properties: true },
        },
      },
    }),
    prisma.plan.findMany({
      orderBy: { price: "asc" },
    }),
  ]);

  const dbPropertyTypes =
    propertyTypesResult.status === "fulfilled" &&
    propertyTypesResult.value.length > 0
      ? propertyTypesResult.value
      : fallbackPropertyTypes.map((type) => ({
          id: type.id,
          name: type.title.en,
          name_ar: type.title.ar,
          name_fr: type.title.fr ?? type.title.en,
          _count: { properties: type.count },
        }));

  const dbPlans =
    plansResult.status === "fulfilled" && plansResult.value.length > 0
      ? plansResult.value
      : fallbackPlans.map((plan) => ({
          id: plan.id,
          title: plan.title.en,
          title_ar: plan.title.ar,
          title_fr: plan.title.fr ?? plan.title.en,
          description: plan.description.en,
          description_ar: plan.description.ar,
          description_fr: plan.description.fr ?? plan.description.en,
          price: plan.price,
          listings:
            plan.listings === "unlimited" ? null : Number(plan.listings),
          featured: plan.featured,
        }));

  if (plansResult.status === "rejected") {
    console.error("Failed to load plans for landing page, using fallback", {
      error: plansResult.reason,
    });
  }

  const featuredProperties = properties
    .filter((property) => property.featured)
    .slice(0, 3)
    .map((property) => ({
      ...property,
      title: (property.title[locale as keyof typeof property.title] ??
        property.title.en) as string,
      description: (property.description[
        locale as keyof typeof property.description
      ] ?? property.description.en) as string,
      city: (property.city[locale as keyof typeof property.city] ??
        property.city.en) as string,
      propertyType: property.propertyType || "Other",
    }));

  return (
    <div className="min-h-screen bg-background">
      <SiteNavbar locale={locale} messages={messages} session={session} />
      <main>
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.10),transparent_24%)]" />
          <SectionReveal>
            <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-24">
              <div className="space-y-8 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm text-muted-foreground shadow-sm justify-center lg:justify-start">
                  <BadgeCheck className="h-4 w-4 text-green-500" />
                  {t(locale, {
                    en: "Verified, multilingual rental marketplace",
                    ar: "منصة موثقة ومتعددة اللغات",
                    fr: "Marketplace de location vérifié et multilingue",
                  })}
                </div>
                <div className="space-y-5 w-full">
                  <AnimatedHeroText
                    items={
                      (messages.home
                        .heroRotatingTitles as readonly string[]) || [
                        messages.home.heroTitle,
                      ]
                    }
                    className={`${
                      locale === "ar" ? "text-right" : "text-left"
                    } max-w-3xl text-2xl font-semibold tracking-tight text-balance md:text-3xl text-center`}
                  />
                  <p
                    className={` ${locale === "ar" ? "text-right" : "text-left"} max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl`}
                  >
                    {messages.home.heroDescription}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  <ButtonLink
                    href={`/${locale}/properties`}
                    variant="accent"
                    size="lg"
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
                  >
                    <Search className="h-4 w-4" />
                    {messages.home.heroCta}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </ButtonLink>
                  {session?.user?.role === "USER" ? (
                    <BecomeSellerButton locale={locale} />
                  ) : null}
                </div>
                <StatGrid
                  locale={locale}
                  items={stats.map((item) => ({
                    label: t(locale, item.label),
                    value: item.value,
                    icon: <Shield className="h-4 w-4" />,
                  }))}
                />
              </div>

              <Card className="glass border-border/70 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.5)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                      <Search className="h-5 w-5" />
                    </span>
                    {messages.home.searchTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl bg-muted/40 p-5 w-full flex flex-col items-center lg:items-start">
                      <div className="text-sm text-muted-foreground">
                        {messages.common.city}
                      </div>
                      <div className="mt-2 text-xl font-semibold">Tetouan</div>
                    </div>
                    <div className="rounded-3xl bg-muted/40 p-5 w-full flex flex-col items-center lg:items-start">
                      <div className="text-sm text-muted-foreground">
                        {messages.common.price}
                      </div>
                      <div className="mt-2 text-xl font-semibold">
                        {formatCurrency(1500, locale)}
                      </div>
                    </div>
                    <div className="rounded-3xl bg-muted/40 p-5 w-full flex flex-col items-center lg:items-start">
                      <div className="text-sm text-muted-foreground">
                        {messages.common.rooms}
                      </div>
                      <div className="mt-2 text-xl font-semibold">4</div>
                    </div>
                    <div className="rounded-3xl bg-muted/40 p-5 w-full flex flex-col items-center lg:items-start">
                      <div className="text-sm text-muted-foreground">
                        {messages.common.verified}
                      </div>
                      <div className="mt-2 text-xl font-semibold">100%</div>
                    </div>
                  </div>
                  <ButtonLink
                    href={`/${locale}/properties`}
                    variant="default"
                    className="w-full"
                  >
                    <Search className="h-4 w-4" />
                    {messages.common.search}
                  </ButtonLink>
                </CardContent>
              </Card>
            </div>
          </SectionReveal>
        </div>

        <SectionReveal className="section-anchor mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center lg:text-left">
          <SectionHeading
            eyebrow={t(locale, {
              en: "Top picks",
              ar: "الأكثر طلباً",
              fr: "Coups de cœur",
            })}
            title={messages.home.featuredTitle}
            description={t(locale, {
              en: "Hand-picked homes from top sellers.",
              ar: "عقارات منتقاة بعناية من أفضل البائعين.",
              fr: "Des logements sélectionnés avec soin parmi les meilleurs vendeurs.",
            })}
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featuredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                locale={locale}
                property={property}
                favoriteEnabled={false}
              />
            ))}
          </div>
        </SectionReveal>

        <SectionReveal className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center lg:text-left">
          <SectionHeading
            eyebrow={t(locale, {
              en: "Explore by type",
              ar: "استكشف الأنواع",
              fr: "Explorer par type",
            })}
            title={messages.home.categoriesTitle}
            description={t(locale, {
              en: "Start with the type that fits your lifestyle.",
              ar: "ابدأ بالنوع الذي يناسب احتياجك.",
              fr: "Commencez par le type qui correspond à votre style de vie.",
            })}
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {dbPropertyTypes.map((type) => (
              <Card
                key={type.id}
                className="group border-border/70 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 mx-auto lg:mx-0">
                    {t(locale, {
                      en: type.name,
                      ar: type.name_ar ?? type.name,
                      fr: type.name_fr ?? type.name,
                    })}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mx-auto lg:mx-0">
                    {t(locale, {
                      en: `${type._count.properties} properties`,
                      ar: `${type._count.properties} عقار`,
                      fr: `${type._count.properties} biens`,
                    })}
                  </p>
                </CardHeader>
                <CardContent className="flex items-end justify-between">
                  <div className="text-3xl font-semibold">
                    {type._count.properties}
                  </div>
                  <Link
                    href={`/${locale}/properties`}
                    className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-300"
                  >
                    {t(locale, { en: "Browse", ar: "تصفح", fr: "Parcourir" })}
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <Link
            href="/en/properties"
            className="mt-6 flex items-center justify-center gap-3 text-sm font-medium text-violet-600 hover:underline dark:text-violet-300"
          >
            {t(locale, {
              en: "View all property types",
              ar: "عرض جميع أنواع العقارات",
              fr: "Voir tous les types de propriete",
            })}
          </Link>
        </SectionReveal>

        <SectionReveal className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center lg:text-left">
          <SectionHeading
            eyebrow={t(locale, { en: "Plans", ar: "الخطط", fr: "Forfaits" })}
            title={messages.home.plansTitle}
            description={messages.pricing.subtitle}
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {dbPlans.map((plan) => {
              const unlimitedLabel = t(locale, {
                en: "Unlimited",
                ar: "غير محدود",
                fr: "Illimitée",
              });

              return (
                <Card
                  key={plan.id}
                  className={
                    plan.id === "plan_pro"
                      ? "relative border-violet-500/30 bg-violet-500/5 overflow-visible"
                      : "border-border/70"
                  }
                >
                  {plan.id === "plan_pro" && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <div className="flex items-center gap-1.5 rounded-full bg-linear-to-r from-violet-600 to-fuchsia-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-violet-500/30">
                        <Sparkles className="h-3 w-3" />
                        {t(locale, {
                          en: "Best Value",
                          ar: "أفضل قيمة",
                          fr: "Meilleur rapport qualité-prix",
                        })}
                      </div>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center justify-center lg:justify-between gap-3 ">
                      <CardTitle>
                        {t(locale, {
                          en: plan.title,
                          ar: plan.title_ar || plan.title,
                          fr: plan.title_fr || plan.title,
                        })}
                      </CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t(locale, {
                        en: plan.description,
                        ar: plan.description_ar || plan.description,
                        fr: plan.description_fr || plan.description,
                      })}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="text-4xl font-semibold">
                      {plan.price === 0
                        ? t(locale, { en: "Free", ar: "مجاني", fr: "Gratuit" })
                        : formatCurrency(plan.price, locale)}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Sparkles className="h-4 w-4 text-violet-500" />
                        {t(locale, {
                          en: `Limit: ${plan.listings === null ? unlimitedLabel : plan.listings}`,
                          ar: `الحد: ${plan.listings === null ? unlimitedLabel : plan.listings}`,
                          fr: `Limite: ${plan.listings === null ? unlimitedLabel : plan.listings}`,
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </SectionReveal>

        <SectionReveal className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center lg:text-left">
          <SectionHeading
            eyebrow={t(locale, {
              en: "Testimonials",
              ar: "التجارب",
              fr: "Témoignages",
            })}
            title={messages.home.testimonialsTitle}
            description={t(locale, {
              en: "Real feedback from renters and sellers.",
              ar: "تجارب حقيقية من مستأجرين وبائعين.",
              fr: "Des retours réels de locataires et vendeurs.",
            })}
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name}>
                <CardContent className="space-y-4 p-6">
                  <p className="text-sm leading-7 text-muted-foreground">
                    “{testimonial.quote[locale]}”
                  </p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role[locale]} ·{" "}
                      {testimonial.location[locale]}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </SectionReveal>

        <SectionReveal className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Card className="overflow-hidden border-violet-500/20 bg-linear-to-r from-violet-500 to-fuchsia-600 text-white shadow-2xl shadow-violet-500/20">
            <CardContent className="grid gap-8 p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-12">
              <div className="text-center lg:text-left">
                <div className="text-sm uppercase tracking-[0.3em] text-white/75">
                  {messages.home.contactTitle}
                </div>
                <h3 className="mt-4 text-3xl font-semibold md:text-4xl">
                  {t(locale, {
                    en: "We are ready to help you launch, list, or find the right home.",
                    ar: "نحن جاهزون لمساعدتك في إطلاق أو إيجاد المنزل المناسب.",
                    fr: "Nous sommes prêts à vous aider à publier ou trouver le bon logement.",
                  })}
                </h3>
                <p className="mt-4 max-w-2xl text-white/85">
                  {messages.home.contactNote}
                </p>
              </div>
              <ButtonLink
                href={`/${locale}/login`}
                variant="outline"
                className="border-white/25 bg-white/10 text-white hover:bg-white/20"
              >
                {messages.home.contactButton}
              </ButtonLink>
            </CardContent>
          </Card>
        </SectionReveal>
      </main>
      <SiteFooter locale={locale} messages={messages} />
    </div>
  );
}
