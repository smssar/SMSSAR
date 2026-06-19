"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Phone } from "lucide-react";
import {
  defaultPhoneCountry,
  formatPhonePreview,
  phoneCountries,
  groupDigitsPairs,
} from "@/lib/phone";
import type { Locale } from "@/lib/locales";

const t = <T extends { en: string; ar: string; fr: string }>(
  locale: Locale,
  text: T,
) => text[locale] ?? text.en;

type RegisterRole = "user" | "seller" | "smssar";

export function RegisterFields({
  locale,
  initialRole = "user",
  initialPhone,
}: {
  locale: Locale;
  initialRole?: RegisterRole;
  initialPhone?: string;
}) {
  const [role, setRole] = useState<RegisterRole>(initialRole);
  const [countryCode, setCountryCode] = useState(defaultPhoneCountry.code);
  const [countryDialCode, setCountryDialCode] = useState(
    defaultPhoneCountry.dialCode,
  );

  const [phone, setPhone] = useState(initialPhone ?? "");

  const getPhoneCountryByCode = (code: string) =>
    phoneCountries.find((c) => c.code === code) ?? defaultPhoneCountry;

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
          onChange={(event) =>
            setRole(event.currentTarget.value as RegisterRole)
          }
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
          <option value="smssar">
            {locale === "ar" ? "سمسار" : locale === "fr" ? "smssar" : "smssar"}
          </option>
        </Select>
      </div>

      {role === "seller" || role === "smssar" ? (
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

              <div className="flex gap-2 rtl:flex-row-reverse">
                <Select
                  value={countryCode}
                  onChange={(event) => {
                    const newCode = event.target.value;
                    setCountryCode(newCode);
                    setCountryDialCode(getPhoneCountryByCode(newCode).dialCode);

                    try {
                      const formatted = formatPhonePreview(phone, newCode);
                      const dial = getPhoneCountryByCode(
                        newCode,
                      ).dialCode.replace("+", "");
                      const withoutDial = formatted
                        .replace(new RegExp("^\\+?" + dial), "")
                        .trim()
                        .replace(/^0+/, "");
                      setPhone(groupDigitsPairs(withoutDial));
                    } catch {
                      // ignore
                    }
                  }}
                  className="h-11 w-32 shrink-0 rounded-l-2xl rounded-r-none border-r-0 bg-muted/40 px-3 text-left"
                >
                  {phoneCountries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.dialCode}
                    </option>
                  ))}
                </Select>
                <input
                  type="hidden"
                  name="countryDialCode"
                  value={countryDialCode}
                />
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
                  value={phone}
                  onChange={(event) => {
                    let nextValue = event.target.value;
                    nextValue = nextValue.replace(/^0+/, "");
                    const formatted = formatPhonePreview(
                      nextValue,
                      countryCode,
                    );
                    const dial = getPhoneCountryByCode(
                      countryCode,
                    ).dialCode.replace("+", "");
                    const withoutDial = formatted
                      .replace(new RegExp("^\\+?" + dial), "")
                      .trim()
                      .replace(/^0+/, "");
                    setPhone(groupDigitsPairs(withoutDial));
                  }}
                  className="h-11 flex-1 rounded-l-none"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                {getPhoneCountryByCode(countryCode).flag}{" "}
                {getPhoneCountryByCode(countryCode).dialCode}{" "}
                {phone.trim() ? "•" : ""}{" "}
                {t(locale, {
                  en: "This number will be used for seller contact details.",
                  ar: "سيُستخدم هذا الرقم في معلومات التواصل الخاصة بالبائع.",
                  fr: "Ce numéro sera utilisé pour les coordonnées du vendeur.",
                })}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
