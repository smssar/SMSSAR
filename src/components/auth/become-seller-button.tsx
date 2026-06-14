"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  defaultPhoneCountry,
  formatPhonePreview,
  getPhoneCountryByCode,
  phoneCountries,
  validateAndNormalizePhone,
} from "@/lib/phone";
import { groupDigitsPairs } from "@/lib/phone";
import type { Locale } from "@/lib/locales";

export function BecomeSellerButton({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [countryCode, setCountryCode] = React.useState(
    defaultPhoneCountry.code,
  );
  const [phone, setPhone] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const selectedCountry = getPhoneCountryByCode(countryCode);

  const text = {
    title:
      locale === "ar"
        ? "التحول إلى بائع"
        : locale === "fr"
          ? "Devenir vendeur"
          : "Become a seller",
    message:
      locale === "ar"
        ? "أدخل رقم هاتفك لتفعيل حساب البائع."
        : locale === "fr"
          ? "Entrez votre numero de telephone pour activer votre compte vendeur."
          : "Enter your phone number to activate your seller account.",
    phone:
      locale === "ar"
        ? "رقم الهاتف"
        : locale === "fr"
          ? "Numero de telephone"
          : "Phone number",
    placeholder: "+971 50 000 0000",
    cancel: locale === "ar" ? "إلغاء" : locale === "fr" ? "Annuler" : "Cancel",
    confirm:
      locale === "ar"
        ? "تأكيد التحول"
        : locale === "fr"
          ? "Confirmer"
          : "Confirm",
    invalid:
      locale === "ar"
        ? "يرجى إدخال رقم هاتف صحيح."
        : locale === "fr"
          ? "Veuillez saisir un numero de telephone valide."
          : "Please enter a valid phone number.",
    failed:
      locale === "ar"
        ? "تعذر التحويل إلى بائع. حاول مرة أخرى."
        : locale === "fr"
          ? "Impossible de devenir vendeur. Veuillez reessayer."
          : "Failed to become seller. Please try again.",
  };

  async function handleConfirm() {
    const normalized = validateAndNormalizePhone(phone, countryCode);

    if (!normalized.valid) {
      setError(text.invalid);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/users/become-seller", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: normalized.e164 }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(payload?.error ?? text.failed);
        setLoading(false);
        return;
      }

      setOpen(false);
      setLoading(false);
      router.replace(`/${locale}/dashboard/seller`);
      router.refresh();
    } catch {
      setError(text.failed);
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="lg" onClick={() => setOpen(true)}>
        {text.title}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={() => {
              if (!loading) {
                setOpen(false);
                setError(null);
              }
            }}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border/70 bg-background p-6 shadow-2xl">
            <h3 className="text-lg font-semibold tracking-tight">
              {text.title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{text.message}</p>

            <div className="mt-4 space-y-2">
              <Label htmlFor="become-seller-phone">{text.phone}</Label>
              <div className="flex gap-2 rtl:flex-row-reverse">
                <Select
                  value={countryCode}
                  onChange={(event) => {
                    const newCode = event.target.value;
                    setCountryCode(newCode);

                    // Reformat current phone for the newly selected country
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
                  disabled={loading}
                  className="h-11 w-32 shrink-0 rounded-l-2xl rounded-r-none border-r-0 bg-muted/40 px-3  text-left"
                >
                  {phoneCountries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.dialCode}
                    </option>
                  ))}
                </Select>
                <Input
                  id="become-seller-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => {
                    let nextValue = event.target.value;
                    // accept numbers without an initial zero
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
                    setError(null);
                  }}
                  placeholder={text.placeholder}
                  className="h-11 flex-1 rounded-l-none "
                  disabled={loading}
                  inputMode="tel"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedCountry.flag} {selectedCountry.dialCode}{" "}
                {phone.trim() ? "•" : ""} format checked automatically.
              </p>
            </div>

            {error ? (
              <div className="mt-3 rounded-lg border border-rose-300/60 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-700/60 dark:bg-rose-900/20 dark:text-rose-300">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  setError(null);
                }}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {text.cancel}
              </Button>
              <Button
                variant="accent"
                onClick={handleConfirm}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? `${text.confirm}...` : text.confirm}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
