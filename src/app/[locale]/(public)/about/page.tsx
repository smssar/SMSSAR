import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Clock3,
  Globe2,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/section-heading";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";

type AboutMessages = {
  metaTitle: string;
  metaDescription: string;
  badge: string;
  heroTitle: string;
  heroDescription: string;
  primaryCta: string;
  secondaryCta: string;
  stats: Array<{ value: string; label: string }>;
  story: { eyebrow: string; title: string; description: string };
  values: {
    eyebrow: string;
    title: string;
    description: string;
    items: Array<{ key: string; title: string; description: string }>;
  };
  journey: {
    eyebrow: string;
    title: string;
    description: string;
    milestones: Array<{ year: string; title: string; description: string }>;
  };
  final: {
    badge: string;
    title: string;
    description: string;
    primary: string;
    secondary: string;
  };
};

function buildFallbackAbout(
  messages: ReturnType<typeof getMessages>,
): AboutMessages {
  return {
    metaTitle: `${messages.nav.about} | Smssar`,
    metaDescription:
      "Learn more about the team and mission behind the platform.",
    badge: messages.nav.about,
    heroTitle: messages.nav.about,
    heroDescription: "",
    primaryCta: messages.nav.properties,
    secondaryCta: messages.nav.register,
    stats: [],
    story: { eyebrow: "", title: "", description: "" },
    values: {
      eyebrow: "",
      title: "",
      description: "",
      // Keep three safe placeholders because the page renders three value cards explicitly.
      items: [
        { key: "trust", title: "", description: "" },
        { key: "language", title: "", description: "" },
        { key: "service", title: "", description: "" },
      ],
    },
    journey: { eyebrow: "", title: "", description: "", milestones: [] },
    final: {
      badge: "",
      title: "",
      description: "",
      primary: messages.nav.properties,
      secondary: messages.nav.register,
    },
  };
}

function resolveAboutMessages(
  locale: Locale,
  messages: ReturnType<typeof getMessages>,
): AboutMessages {
  const fallback = buildFallbackAbout(messages);
  const englishMessages = getMessages("en");
  const englishFallback = buildFallbackAbout(englishMessages);
  const localeMessages = messages as {
    dashboard?: {
      seller?: { about?: AboutMessages };
      admin?: { about?: AboutMessages };
      about?: AboutMessages;
    };
    about?: AboutMessages;
  };
  const englishLocaleMessages = englishMessages as {
    dashboard?: {
      seller?: { about?: AboutMessages };
      admin?: { about?: AboutMessages };
      about?: AboutMessages;
    };
    about?: AboutMessages;
  };

  const candidate =
    localeMessages.about ??
    localeMessages.dashboard?.seller?.about ??
    localeMessages.dashboard?.about;

  const englishCandidate =
    englishLocaleMessages.about ??
    englishLocaleMessages.dashboard?.seller?.about ??
    englishLocaleMessages.dashboard?.about;

  // Backward-compatible fallbacks for currently misplaced localized content.
  const legacyLocaleCandidate =
    locale === "ar"
      ? englishLocaleMessages.dashboard?.admin?.about
      : locale === "fr"
        ? englishLocaleMessages.dashboard?.about
        : undefined;

  const source = candidate ?? legacyLocaleCandidate ?? englishCandidate;

  if (!source) {
    return fallback;
  }

  return {
    ...englishFallback,
    ...fallback,
    ...source,
    stats: source.stats ?? englishFallback.stats,
    story: { ...englishFallback.story, ...(source.story ?? {}) },
    values: {
      ...englishFallback.values,
      ...(source.values ?? {}),
      items:
        source.values?.items && source.values.items.length > 0
          ? source.values.items
          : englishFallback.values.items,
    },
    journey: {
      ...englishFallback.journey,
      ...(source.journey ?? {}),
      milestones:
        source.journey?.milestones ?? englishFallback.journey.milestones,
    },
    final: { ...englishFallback.final, ...(source.final ?? {}) },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const messages = getMessages(locale);
  const about = resolveAboutMessages(locale, messages);

  const title = about.metaTitle;
  const description = about.metaDescription;

  const basePath = `/${locale}/about`;

  return {
    title,
    description,
    alternates: {
      canonical: basePath,
      languages: {
        en: "/en/about",
        ar: "/ar/about",
        fr: "/fr/about",
        "x-default": "/en/about",
      },
    },
    openGraph: {
      title,
      description,
      url: basePath,
      type: "website",
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const messages = getMessages(locale);
  const about = resolveAboutMessages(locale, messages);

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.08),transparent_28%)]" />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm text-muted-foreground shadow-sm">
              <BadgeCheck className="h-4 w-4 text-violet-600 dark:text-violet-300" />
              {about.badge}
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-balance md:text-6xl">
                {about.heroTitle}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
                {about.heroDescription}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ButtonLink
                href={`/${locale}/properties`}
                variant="accent"
                size="lg"
                className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
              >
                {about.primaryCta}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </ButtonLink>
              <ButtonLink
                href={`/${locale}/register`}
                variant="outline"
                size="lg"
              >
                {about.secondaryCta}
              </ButtonLink>
            </div>
          </div>

          <Card className="glass border-border/70 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.5)]">
            <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
              {about.stats.map(
                (item: { value: string; label: string }, index: number) => (
                  <div
                    key={`${item.value}-${index}`}
                    className="rounded-3xl border border-border/70 bg-muted/30 p-5"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                      {index === 0 ? (
                        <Users className="h-5 w-5" />
                      ) : index === 1 ? (
                        <Clock3 className="h-5 w-5" />
                      ) : index === 2 ? (
                        <Building2 className="h-5 w-5" />
                      ) : (
                        <Sparkles className="h-5 w-5" />
                      )}
                    </div>
                    <div className="mt-4 text-2xl font-semibold">
                      {item.value}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {item.label}
                    </p>
                  </div>
                ),
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          align="left"
          eyebrow={about.story.eyebrow}
          title={about.story.title}
          description={about.story.description}
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <Card className="border-border/70">
            <CardContent className="space-y-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold">
                {about.values.items[0].title}
              </h3>
              <p className="leading-7 text-muted-foreground">
                {about.values.items[0].description}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardContent className="space-y-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                <Globe2 className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold">
                {about.values.items[1].title}
              </h3>
              <p className="leading-7 text-muted-foreground">
                {about.values.items[1].description}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardContent className="space-y-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold">
                {about.values.items[2].title}
              </h3>
              <p className="leading-7 text-muted-foreground">
                {about.values.items[2].description}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          align="left"
          eyebrow={about.values.eyebrow}
          title={about.values.title}
          description={about.values.description}
        />

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {about.values.items.map(
            (
              value: { key: string; title: string; description: string },
              index: number,
            ) => (
              <Card key={value.key} className="border-border/70">
                <CardContent className="space-y-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                    {index === 0 ? (
                      <ShieldCheck className="h-5 w-5" />
                    ) : index === 1 ? (
                      <Globe2 className="h-5 w-5" />
                    ) : (
                      <HeartHandshake className="h-5 w-5" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold">{value.title}</h3>
                  <p className="leading-7 text-muted-foreground">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          align="left"
          eyebrow={about.journey.eyebrow}
          title={about.journey.title}
          description={about.journey.description}
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {about.journey.milestones.map(
            (item: { year: string; title: string; description: string }) => (
              <Card key={item.year} className="border-border/70">
                <CardContent className="space-y-4 p-6">
                  <div className="inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-700 dark:text-violet-300">
                    {item.year}
                  </div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="leading-7 text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pb-28">
        <Card className="overflow-hidden border-border/70 bg-linear-to-br from-violet-600 to-fuchsia-600 text-white shadow-[0_30px_90px_-45px_rgba(91,33,182,0.65)]">
          <CardContent className="grid gap-8 p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm text-white/90">
                <Sparkles className="h-4 w-4" />
                {about.final.badge}
              </div>
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                {about.final.title}
              </h2>
              <p className="max-w-2xl text-base leading-7 text-white/85 md:text-lg">
                {about.final.description}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <ButtonLink
                href={`/${locale}/properties`}
                variant="secondary"
                size="lg"
              >
                {about.final.primary}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </ButtonLink>
              <ButtonLink
                href={`/${locale}/register`}
                variant="outline"
                size="lg"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                {about.final.secondary}
              </ButtonLink>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
