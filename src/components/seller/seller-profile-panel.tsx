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
import type { Locale } from "@/lib/locales";

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
  const [phone, setPhone] = useState(initialSeller.phone ?? "");
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validate phone if provided
    if (phone.trim()) {
      const phoneValidation = validateAndNormalizePhone(phone, countryCode);
      if (!phoneValidation.valid) {
        toast.error(
          locale === "ar"
            ? "يرجى إدخال رقم هاتف صحيح."
            : locale === "fr"
              ? "Veuillez saisir un numero de telephone valide."
              : "Please enter a valid phone number.",
        );
        return;
      }
    }

    if (hasPassword && newPassword && !currentPassword) {
      toast.error(
        locale === "ar"
          ? "يرجى إدخال كلمة المرور الحالية لتغييرها."
          : locale === "fr"
            ? "Veuillez entrer votre mot de passe actuel pour le modifier."
            : "Please enter your current password to change it.",
      );
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

  const performSave = async () => {
    setLoading(true);
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
        headers: { "Content-Type": "application/json" },
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
        throw new Error(payload?.error || `Status ${response.status}`);
      }

      const updated = payload?.data as SellerProfile | undefined;
      if (updated) {
        setName(updated.name);
        setEmail(updated.email);
        setPhone(updated.phone ?? "");
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
      toast.error(
        t(locale, {
          en: "Could not update the profile.",
          ar: "تعذر تحديث الملف الشخصي.",
          fr: "Impossible de mettre à jour le profil.",
        }),
      );
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

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
                <div className="grid grid-cols-[128px_1fr] gap-2">
                  <Select
                    value={countryCode}
                    onChange={(event) => setCountryCode(event.target.value)}
                    disabled={loading}
                    className="h-11 rounded-l-2xl rounded-r-none border-r-0 bg-muted/40 px-3"
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
                      setPhone(formatPhonePreview(nextValue, countryCode));
                    }}
                    className="h-11 rounded-r-2xl rounded-l-none"
                    placeholder={t(locale, {
                      en: "50 000 0000",
                      ar: "50 000 0000",
                      fr: "50 000 0000",
                    })}
                  />
                </div>
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

            <Button type="submit" className="h-11 gap-2" disabled={loading}>
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
