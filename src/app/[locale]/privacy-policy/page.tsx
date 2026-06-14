/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SiteFooter, SiteNavbar } from "@/components/layout";
import { auth } from "@/auth";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";
import {
  Shield,
  Mail,
  Phone,
  MapPin,
  Building2,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

async function getLocale() {
  const cookieStore = await cookies();
  return cookieStore.get("locale")?.value || "en";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as Locale;

  const title =
    locale === "ar"
      ? "سياسة الخصوصية - سماسر"
      : locale === "fr"
        ? "Politique de Confidentialité - Samssar"
        : "Privacy Policy - Samssar";

  const description =
    locale === "ar"
      ? "سياسة الخصوصية لمنصة سماسر - تعرف على كيفية جمع، استخدام، وحماية بياناتك الشخصية."
      : locale === "fr"
        ? "Politique de confidentialité de Samssar - Découvrez comment nous collectons, utilisons et protégeons vos données personnelles."
        : "Samssar Privacy Policy - Learn how we collect, use, and protect your personal data.";

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/privacy-policy`,
    },
  };
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const locale = (resolvedParams.locale || (await getLocale())) as Locale;
  const messages = getMessages(locale);
  const session = await auth();
  const pp = messages.privacyPolicy;
  const isRtl = locale === "ar";

  const t = (en: string, ar: string, fr: string) =>
    locale === "ar" ? ar : locale === "fr" ? fr : en;

  return (
    <>
      <SiteNavbar locale={locale} messages={messages} session={session} />
      {/* Hero header */}
      <section className="relative overflow-hidden border-b border-border/40 bg-linear-to-b from-violet-50/80 to-background dark:from-violet-950/10">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.12),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.08),transparent_50%)]" />
        <div className="mx-auto max-w-4xl px-4 pb-14 pt-20 sm:px-6 lg:px-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300 ring-1 ring-violet-500/20">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {pp.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground/80 max-w-2xl mx-auto">
            {pp.intro2}
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
              {t("Updated", "مُحدَّث", "Mis à jour")}
            </span>
            <span>{pp.lastUpdated}</span>
          </div>
        </div>
      </section>

      <main
        className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8"
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* Intro lead */}
        <div className="mb-14 rounded-2xl border border-border/50 bg-card/50 p-6 sm:p-8">
          <p className="text-base leading-relaxed text-foreground/85 sm:text-lg">
            {pp.intro}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {pp.sections.map((section: any, idx: number) => (
            <section
              key={idx}
              className="scroll-mt-24 rounded-xl border border-border/30 bg-card/30 p-6 transition hover:border-border/60 hover:bg-card/60 sm:p-8"
            >
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {section.title}
              </h2>

              <div className="mt-4 space-y-4">
                <p className="leading-relaxed text-muted-foreground">
                  {section.body}
                </p>

                {section.list && (
                  <ul className="space-y-2">
                    {section.list.map((item: string, liIdx: number) => (
                      <li
                        key={liIdx}
                        className="flex items-start gap-3 text-sm text-muted-foreground/90"
                      >
                        <span className="mt-1.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-violet-500/10 text-[10px] font-bold text-violet-600 dark:text-violet-300">
                          {liIdx + 1}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {section.body2 && (
                  <p className="leading-relaxed text-muted-foreground">
                    {section.body2}
                  </p>
                )}
                {section.body3 && (
                  <p className="leading-relaxed text-muted-foreground">
                    {section.body3}
                  </p>
                )}

                {section.contact && (
                  <div className="not-prose mt-6 rounded-xl border border-border/60 bg-linear-to-br from-violet-50/60 to-background p-6 dark:from-violet-950/20">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {t(
                        "Contact Information",
                        "معلومات الاتصال",
                        "Coordonnées",
                      )}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-300">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t("Company", "الشركة", "Société")}
                          </p>
                          <p className="text-sm font-medium">
                            {section.contact.company}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-300">
                          <Mail className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t("Email", "البريد الإلكتروني", "Email")}
                          </p>
                          <a
                            href={`mailto:${section.contact.email}`}
                            className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
                          >
                            {section.contact.email}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-300">
                          <Phone className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t("Phone", "الهاتف", "Téléphone")}
                          </p>
                          <p className="text-sm font-medium">
                            {section.contact.phone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-300">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t("Address", "العنوان", "Adresse")}
                          </p>
                          <p className="text-sm font-medium">
                            {section.contact.address}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-14 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border/50 bg-muted/20 p-8 text-center">
          <Shield className="h-8 w-8 text-violet-500/60" />
          <p className="max-w-lg text-sm text-muted-foreground">
            {t(
              "If you have any questions about this Privacy Policy, please don't hesitate to reach out to our support team.",
              "إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، فلا تتردد في التواصل مع فريق الدعم لدينا.",
              "Si vous avez des questions concernant cette Politique de Confidentialité, n'hésitez pas à contacter notre équipe d'assistance.",
            )}
          </p>
          <Link
            href={`/${locale}/contact`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            {t("Contact Us", "اتصل بنا", "Contactez-nous")}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </main>

      <SiteFooter locale={locale} messages={messages} />
    </>
  );
}
