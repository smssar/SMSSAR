"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Phone, Store } from "lucide-react";
import type { Locale } from "@/lib/locales";

const t = <T extends { en: string; ar: string; fr: string }>(
  locale: Locale,
  text: T,
) => text[locale] ?? text.en;

type RegisterRole = "user" | "seller";

export function RegisterFields({
  locale,
  initialRole = "user",
}: {
  locale: Locale;
  initialRole?: RegisterRole;
}) {
  const [role, setRole] = useState<RegisterRole>(initialRole);

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="role">
          {t(locale, {
            en: "Account type",
            ar: "نوع الحساب",
            fr: "Type de compte",
          })}
          <span className="text-red-500">*</span>
        </Label>
        <Select
          id="role"
          name="role"
          value={role}
          onChange={(event) => setRole(event.target.value as RegisterRole)}
          className="h-11 rounded-2xl border-border/70 bg-background/80 shadow-sm transition focus-visible:border-violet-500 focus-visible:ring-violet-500"
        >
          <option value="user">
            {locale === "ar"
              ? "مستأجر"
              : locale === "fr"
                ? "Locataire"
                : "Renter"}
          </option>
          <option value="seller">
            {locale === "ar" ? "بائع" : locale === "fr" ? "Vendeur" : "Seller"}
          </option>
        </Select>
      </div>

      {role === "seller" ? (
        <div className="rounded-3xl border border-violet-500/20 bg-violet-500/5 p-4 shadow-sm ring-1 ring-violet-500/10">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
              <Phone className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  {t(locale, {
                    en: "Phone number",
                    ar: "رقم الهاتف",
                    fr: "Numéro de téléphone",
                  })}
                  <span className="text-red-500">*</span>
                </Label>
                <Badge
                  variant="secondary"
                  className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300"
                >
                  {locale === "ar"
                    ? "مطلوب"
                    : locale === "fr"
                      ? "Requis"
                      : "Required"}
                </Badge>
              </div>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-600 dark:text-violet-300 rtl:left-auto rtl:right-4" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={t(locale, {
                    en: "+971 50 000 0000",
                    ar: "+971 50 000 0000",
                    fr: "+971 50 000 0000",
                  })}
                  className="h-11 rounded-2xl border-violet-500/20 bg-background/80 pl-11 shadow-sm transition focus-visible:border-violet-500 focus-visible:ring-violet-500 rtl:pr-11 rtl:pl-4"
                />
              </div>
              <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                <Store className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  {t(locale, {
                    en: "This number will be used for seller contact details.",
                    ar: "سيُستخدم هذا الرقم في معلومات التواصل الخاصة بالبائع.",
                    fr: "Ce numéro sera utilisé pour les coordonnées du vendeur.",
                  })}
                </span>
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
