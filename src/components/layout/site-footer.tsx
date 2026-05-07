import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import type { Locale } from "@/lib/locales";
import type { Messages } from "@/lib/messages";

export function SiteFooter({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages;
}) {
  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
        <div>
          <div className="text-xl font-semibold">House Rental Platform</div>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
            {messages.footer.tagline}
          </p>
          <div className="mt-6 flex flex-col gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> support@houserental.example
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> +971 50 000 0000
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Morocco
            </div>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {messages.footer.quickLinks}
          </div>
          <div className="mt-4 grid gap-3 text-sm">
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
              href={`/${locale}/pricing`}
              className="text-foreground/80 transition hover:text-foreground"
            >
              {messages.nav.pricing}
            </Link>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {messages.footer.support}
          </div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            {messages.home.contactNote}
          </p>
          <Link
            href={`/${locale}/login`}
            className="mt-6 inline-flex text-sm font-medium text-violet-600 hover:underline dark:text-violet-300"
          >
            {messages.nav.login}
          </Link>
        </div>
      </div>
      <div className="border-t border-border/60 px-4 py-6 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
        © {new Date().getFullYear()} House Rental Platform.{" "}
        {messages.footer.rights}
      </div>
    </footer>
  );
}
