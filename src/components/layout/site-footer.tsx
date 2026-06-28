import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import type { Locale } from "@/lib/locales";
import type { Messages } from "@/lib/messages";
import { auth } from "@/auth";

export async function SiteFooter({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages;
}) {
  const session = await auth();
  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 text-center sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr] lg:px-8 lg:text-left">
        <div className="flex flex-col items-center lg:items-start">
          <div className="text-xl font-semibold">
            {locale === "ar" ? "سمسار" : "Smssar"}
          </div>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground lg:mt-4 lg:max-w-xl lg:text-left">
            {messages.footer.tagline}
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 text-sm text-muted-foreground lg:items-start">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> support@smsaar.ma
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span dir="ltr" className="inline-block">
                +212 700754242
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />{" "}
              {locale === "ar"
                ? "المغرب"
                : locale === "fr"
                  ? "Maroc"
                  : "Morocco"}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center lg:items-start">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {messages.footer.quickLinks}
          </div>
          <div className="mt-4 flex flex-col items-center gap-3 text-sm lg:items-start">
            <Link
              href={`/${locale}`}
              className="text-foreground/80 transition hover:text-foreground"
            >
              {messages.nav.home}
            </Link>
            <Link
              href={`/${locale}/properties`}
              className="text-foreground/80 transition hover:text-foreground"
            >
              {messages.nav.properties}
            </Link>
            <Link
              href={`/${locale}/about`}
              className="text-foreground/80 transition hover:text-foreground"
            >
              {messages.nav.about}
            </Link>
            <Link
              href={`/${locale}/pricing`}
              className="text-foreground/80 transition hover:text-foreground"
            >
              {messages.nav.pricing}
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center lg:items-start">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {messages.footer.support}
          </div>
          <Link
            href={`/${locale}/privacy-policy`}
            className="mt-6 inline-flex text-sm font-medium text-violet-600 hover:underline dark:text-violet-300"
          >
            {messages.privacyPolicy.title}
          </Link>
          <p className="mt-4 text-sm leading-7 text-muted-foreground lg:text-left">
            {messages.home.contactNote}
          </p>
          {!session?.user ? (
            <Link
              href={`/${locale}/login`}
              className="mt-6 inline-flex text-sm font-medium text-violet-600 hover:underline dark:text-violet-300"
            >
              {messages.nav.login}
            </Link>
          ) : null}
        </div>
      </div>
      <div className="border-t border-border/60 px-4 py-6 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
        © {new Date().getFullYear()} Smssar. {messages.footer.rights}
      </div>
    </footer>
  );
}
