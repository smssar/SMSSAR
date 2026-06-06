"use client";

import Link from "next/link";
import { useState } from "react";
import { Edit3, Loader2, Mail, Save, Shield, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  defaultPhoneCountry,
  formatPhonePreview,
  getPhoneCountryByCode,
  phoneCountries,
  validateAndNormalizePhone,
} from "@/lib/phone";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import type { Locale } from "@/lib/locales";
import { isLocale } from "@/lib/locales";
import { messages } from "@/lib/messages";

const t = <T extends { en: string; ar: string; fr: string }>(
  locale: Locale,
  text: T,
) => text[locale] ?? text.en;

type SellerProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  bio?: string | null;
  createdAt: Date | string;
  hasPassword: boolean;
};

export function SellerProfilePanel({
  locale,
  initialSeller,
}: {
  locale: Locale;
  initialSeller: SellerProfile;
}) {
  const [name, setName] = useState(initialSeller.name);
  const [email, setEmail] = useState(initialSeller.email);
  const initialPhoneDisplay = (() => {
    const raw = initialSeller.phone ?? "";
    if (!raw) return "";
    try {
      const parsed = parsePhoneNumberFromString(raw as string);
      return parsed ? parsed.formatNational() : raw.replace(/^\+/, "");
    } catch {
      return raw.replace(/^\+/, "");
    }
  })();

  const [phone, setPhone] = useState(initialPhoneDisplay);
  const [countryCode, setCountryCode] = useState(defaultPhoneCountry.code);
  const [city, setCity] = useState(initialSeller.city ?? "");
  const [bio, setBio] = useState(initialSeller.bio ?? "");
  const [hasPassword, setHasPassword] = useState(initialSeller.hasPassword);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ label: string } | null>(
    null,
  );

  function resolveMsgs(loc: string) {
    if (isLocale(loc)) return messages[loc as Locale];
    const short = String(loc).slice(0, 2);
    if (isLocale(short)) return messages[short as Locale];
    return messages.en;
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validate phone if provided
    if (phone.trim()) {
      const phoneValidation = validateAndNormalizePhone(phone, countryCode);
      if (!phoneValidation.valid) {
        const localized = resolveMsgs(locale);
        const msg =
          localized.errors.invalidPhone ?? messages.en.errors.invalidPhone;
        toast.error(msg);
        return;
      }
    }

    if (hasPassword && newPassword && !currentPassword) {
      const localized = resolveMsgs(locale);
      const msg =
        localized.errors.currentPasswordRequired ??
        messages.en.errors.currentPasswordRequired;
      toast.error(msg);
      return;
    }

    setPendingAction({
      label: t(locale, {
        en: "seller profile",
        ar: "بيانات البائع",
        fr: "profil vendeur",
      }),
    });
  };

  function hasChanges() {
    if (name !== initialSeller.name) return true;
    if (email !== initialSeller.email) return true;
    if ((initialSeller.city ?? "") !== city) return true;
    if ((initialSeller.bio ?? "") !== bio) return true;
    if (newPassword && newPassword.length > 0) return true;

    const initialPhoneNorm = (() => {
      if (!initialSeller.phone) return "";
      const v = validateAndNormalizePhone(initialSeller.phone as string);
      return v && v.valid
        ? (v.e164 ?? initialSeller.phone ?? "")
        : (initialSeller.phone ?? "");
    })();

    const currentPhoneNorm = (() => {
      if (!phone.trim()) return "";
      const v = validateAndNormalizePhone(phone, countryCode);
      return v && v.valid ? (v.e164 ?? phone) : phone;
    })();

    if ((initialPhoneNorm ?? "") !== (currentPhoneNorm ?? "")) return true;

    return false;
  }

  const performSave = async () => {
    setLoading(true);
    const localized = resolveMsgs(locale);
    if (!hasChanges()) {
      const msg = localized.common?.noChanges ?? messages.en.common.noChanges;
      toast(msg);
      setLoading(false);
      return;
    }
    try {
      // Normalize phone before sending
      let normalizedPhone = phone;
      if (phone.trim()) {
        const phoneValidation = validateAndNormalizePhone(phone, countryCode);
        if (phoneValidation.valid) {
          normalizedPhone = phoneValidation.e164;
        }
      }

      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({
          name,
          email,
          phone: normalizedPhone,
          city,
          bio,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const serverMsg = payload?.error || `Status ${response.status}`;
        throw new Error(serverMsg);
      }

      const updated = payload?.data as SellerProfile | undefined;
      if (updated) {
        setName(updated.name);
        setEmail(updated.email);
        try {
          const parsed = updated.phone
            ? parsePhoneNumberFromString(updated.phone as string)
            : null;
          setPhone(parsed ? parsed.formatNational() : (updated.phone ?? ""));
        } catch {
          setPhone(updated.phone ?? "");
        }
        setCity(updated.city ?? "");
        setBio(updated.bio ?? "");
        setHasPassword(Boolean(updated.hasPassword));
      }
      setCurrentPassword("");
      setNewPassword("");
      setPendingAction(null);

      toast.success(
        t(locale, {
          en: "Profile updated.",
          ar: "تم تحديث الملف الشخصي.",
          fr: "Profil mis à jour.",
        }),
      );
    } catch (error) {
      console.error("Failed to update seller profile:", error);
      const serverMsg =
        error instanceof Error && error.message
          ? error.message
          : t(locale, {
              en: "Could not update the profile.",
              ar: "تعذر تحديث الملف الشخصي.",
              fr: "Impossible de mettre à jour le profil.",
            });
      toast.error(serverMsg);
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  const selectedCountry = getPhoneCountryByCode(countryCode);

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/70 backdrop-blur-sm">
        <CardHeader className="border-b border-border/60 pb-5">
          <CardTitle>
            {t(locale, {
              en: "Seller Profile",
              ar: "الملف الشخصي للبائع",
              fr: "Profil vendeur",
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="seller-name"
                  className="flex items-center gap-2"
                >
                  <UserRound className="h-4 w-4 text-violet-500" />
                  {t(locale, { en: "Name", ar: "الاسم", fr: "Nom" })}
                </Label>
                <Input
                  id="seller-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="seller-email"
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4 text-violet-500" />
                  {t(locale, {
                    en: "Email",
                    ar: "البريد الإلكتروني",
                    fr: "E-mail",
                  })}
                </Label>
                <Input
                  id="seller-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11"
                  required
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="seller-phone">
                  {t(locale, {
                    en: "Phone",
                    ar: "رقم الهاتف",
                    fr: "Téléphone",
                  })}
                </Label>
                <div className="flex gap-2 rtl:flex-row-reverse">
                  <Select
                    value={countryCode}
                    onChange={(event) => {
                      const newCode = event.target.value;
                      setCountryCode(newCode);

                      // Reformat current phone for the newly selected country
                      try {
                        const formatted = formatPhonePreview(phone, newCode);
                        // If formatted includes the dial code at start, strip it
                        const dial = getPhoneCountryByCode(
                          newCode,
                        ).dialCode.replace("+", "");
                        const stripped = formatted
                          .replace(new RegExp("^\\+?" + dial), "")
                          .trim();
                        setPhone(stripped);
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
                    id="seller-phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      const formatted = formatPhonePreview(
                        nextValue,
                        countryCode,
                      );
                      // remove leading dial code if present so input doesn't show it
                      const dial = getPhoneCountryByCode(
                        countryCode,
                      ).dialCode.replace("+", "");
                      const stripped = formatted
                        .replace(new RegExp("^\\+?" + dial), "")
                        .trim();
                      setPhone(stripped);
                    }}
                    className="h-11 flex-1 rounded-l-none"
                    placeholder={t(locale, {
                      en: "50 000 0000",
                      ar: "50 000 0000",
                      fr: "50 000 0000",
                    })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedCountry.flag} {selectedCountry.dialCode}{" "}
                  {phone.trim() ? "•" : ""} format checked automatically.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seller-city">
                  {t(locale, { en: "City", ar: "المدينة", fr: "Ville" })}
                </Label>
                <Input
                  id="seller-city"
                  className="h-11"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder={t(locale, {
                    en: "Dubai",
                    ar: "دبي",
                    fr: "Dubaï",
                  })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seller-bio">
                {t(locale, {
                  en: "About seller",
                  ar: "نبذة عن البائع",
                  fr: "À propos du vendeur",
                })}
              </Label>
              <Textarea
                id="seller-bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder={
                  locale === "ar"
                    ? "أخبر العملاء عن نفسك وخدماتك..."
                    : locale === "fr"
                      ? "Parlez aux clients de vous et de vos services..."
                      : "Tell customers about yourself and your services..."
                }
                className="min-h-28 resize-none"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {hasPassword ? (
                <div className="space-y-2">
                  <Label
                    htmlFor="seller-current-password"
                    className="flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4 text-violet-500" />
                    {t(locale, {
                      en: "Current password",
                      ar: "كلمة المرور الحالية",
                      fr: "Mot de passe actuel",
                    })}
                  </Label>
                  <PasswordInput
                    id="seller-current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    placeholder={t(locale, {
                      en: "Enter your current password",
                      ar: "أدخل كلمة المرور الحالية",
                      fr: "Entrez votre mot de passe actuel",
                    })}
                  />
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>
                      {t(locale, {
                        en: "Required only when changing password.",
                        ar: "مطلوب فقط عند تغيير كلمة المرور.",
                        fr: "Requis uniquement lors du changement de mot de passe.",
                      })}
                    </span>
                    <Link
                      href={`/${locale}/forgot-password`}
                      className="font-medium text-violet-600 hover:underline dark:text-violet-300"
                    >
                      {t(locale, {
                        en: "Forgot password?",
                        ar: "هل نسيت كلمة المرور؟",
                        fr: "Mot de passe oublié ?",
                      })}
                    </Link>
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label
                  htmlFor="seller-password"
                  className="flex items-center gap-2"
                >
                  <Shield className="h-4 w-4 text-violet-500" />
                  {t(locale, {
                    en: hasPassword
                      ? "New password (optional)"
                      : "Create password",
                    ar: hasPassword
                      ? "كلمة المرور الجديدة (اختياري)"
                      : "إنشاء كلمة مرور",
                    fr: hasPassword
                      ? "Nouveau mot de passe (facultatif)"
                      : "Créer un mot de passe",
                  })}
                </Label>
                <PasswordInput
                  id="seller-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder={t(locale, {
                    en: "8+ characters",
                    ar: "8 أحرف أو أكثر",
                    fr: "8 caractères ou plus",
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  {t(locale, {
                    en: hasPassword
                      ? "Leave empty if you don't want to change your password."
                      : "Set a password to enable email/password sign-in.",
                    ar: hasPassword
                      ? "اتركه فارغاً إذا لم ترغب في تغيير كلمة المرور."
                      : "قم بتعيين كلمة مرور لتفعيل تسجيل الدخول بالبريد الإلكتروني وكلمة المرور.",
                    fr: hasPassword
                      ? "Laissez vide si vous ne souhaitez pas modifier votre mot de passe."
                      : "Définissez un mot de passe pour activer la connexion par e-mail et mot de passe.",
                  })}
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="h-11 gap-2"
              disabled={loading || !hasChanges()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {t(locale, {
                en: "Save changes",
                ar: "حفظ التغييرات",
                fr: "Enregistrer les modifications",
              })}
            </Button>
          </form>
        </CardContent>
      </Card>

      {pendingAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border/70 bg-card p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Edit3 className="h-6 w-6" />
            </div>

            <h2 className="text-2xl font-semibold tracking-tight">
              {t(locale, {
                en: "Confirm update",
                ar: "تأكيد التحديث",
                fr: "Confirmer la mise à jour",
              })}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {locale === "ar"
                ? `هل تريد تحديث ${pendingAction.label}؟`
                : locale === "fr"
                  ? `Voulez-vous mettre à jour ${pendingAction.label} ?`
                  : `Do you want to update ${pendingAction.label}?`}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPendingAction(null)}
                className="gap-2"
                disabled={loading}
              >
                <X className="h-4 w-4" />
                {t(locale, { en: "Cancel", ar: "إلغاء", fr: "Annuler" })}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  void performSave();
                }}
                className="gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t(locale, {
                      en: "Updating...",
                      ar: "جارٍ التحديث...",
                      fr: "Mise à jour...",
                    })}
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4" />
                    {t(locale, {
                      en: "Update",
                      ar: "تحديث",
                      fr: "Mettre à jour",
                    })}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
