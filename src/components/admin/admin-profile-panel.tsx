"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Edit3,
  Loader2,
  Mail,
  Save,
  Shield,
  UserRound,
  X,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/lib/locales";

const t = <T extends { en: string; ar: string; fr: string }>(
  locale: Locale,
  text: T,
) => text[locale] ?? text.en;

// Error message translations
const getTranslatedErrorMessage = (
  errorMessage: string,
  locale: Locale,
): string => {
  const errorTranslations: Record<
    string,
    { en: string; ar: string; fr: string }
  > = {
    "Name cannot be empty.": {
      en: "Name cannot be empty.",
      ar: "لا يمكن أن يكون الاسم فارغاً.",
      fr: "Le nom ne peut pas être vide.",
    },
    "Name must be at least 2 characters long.": {
      en: "Name must be at least 2 characters long.",
      ar: "يجب أن يكون الاسم بطول 2 حرف على الأقل.",
      fr: "Le nom doit contenir au moins 2 caractères.",
    },
    "Email cannot be empty.": {
      en: "Email cannot be empty.",
      ar: "لا يمكن أن يكون البريد الإلكتروني فارغاً.",
      fr: "L'e-mail ne peut pas être vide.",
    },
    "Please enter a valid email address.": {
      en: "Please enter a valid email address.",
      ar: "يرجى إدخال عنوان بريد إلكتروني صحيح.",
      fr: "Veuillez entrer une adresse e-mail valide.",
    },
    "This email address is already in use. Please use a different email.": {
      en: "This email address is already in use. Please use a different email.",
      ar: "عنوان البريد الإلكتروني هذا قيد الاستخدام بالفعل. يرجى استخدام بريد إلكتروني مختلف.",
      fr: "Cette adresse e-mail est déjà utilisée. Veuillez utiliser un e-mail différent.",
    },
    "Current password is required to change your password. Please enter your current password first.":
      {
        en: "Current password is required to change your password. Please enter your current password first.",
        ar: "كلمة المرور الحالية مطلوبة لتغيير كلمة المرور. يرجى إدخال كلمة المرور الحالية أولاً.",
        fr: "Le mot de passe actuel est requis pour modifier votre mot de passe. Veuillez d'abord entrer votre mot de passe actuel.",
      },
    "Current password cannot be empty. Please enter your current password.": {
      en: "Current password cannot be empty. Please enter your current password.",
      ar: "كلمة المرور الحالية لا يمكن أن تكون فارغة. يرجى إدخال كلمة المرور الحالية.",
      fr: "Le mot de passe actuel ne peut pas être vide. Veuillez entrer votre mot de passe actuel.",
    },
    "The current password you entered is incorrect. Please try again.": {
      en: "The current password you entered is incorrect. Please try again.",
      ar: "كلمة المرور الحالية التي أدخلتها غير صحيحة. يرجى المحاولة مرة أخرى.",
      fr: "Le mot de passe actuel que vous avez saisi est incorrect. Veuillez réessayer.",
    },
    "New password must be at least 8 characters long. Please enter a stronger password.":
      {
        en: "New password must be at least 8 characters long. Please enter a stronger password.",
        ar: "يجب أن تكون كلمة المرور الجديدة بطول 8 أحرف على الأقل. يرجى إدخال كلمة مرور أقوى.",
        fr: "Le nouveau mot de passe doit contenir au moins 8 caractères. Veuillez entrer un mot de passe plus fort.",
      },
    "New password must be different from your current password.": {
      en: "New password must be different from your current password.",
      ar: "يجب أن تكون كلمة المرور الجديدة مختلفة عن كلمة المرور الحالية.",
      fr: "Le nouveau mot de passe doit être différent de votre mot de passe actuel.",
    },
    "User password not found. Please contact support.": {
      en: "User password not found. Please contact support.",
      ar: "لم يتم العثور على كلمة مرور المستخدم. يرجى الاتصال بالدعم.",
      fr: "Mot de passe utilisateur introuvable. Veuillez contacter le support.",
    },
    "An email or value you entered is already in use. Please try again.": {
      en: "An email or value you entered is already in use. Please try again.",
      ar: "البريد الإلكتروني أو القيمة التي أدخلتها قيد الاستخدام بالفعل. يرجى المحاولة مرة أخرى.",
      fr: "L'e-mail ou la valeur que vous avez saisi est déjà utilisé. Veuillez réessayer.",
    },
    "No valid fields were provided.": {
      en: "No valid fields were provided.",
      ar: "لم يتم توفير أي حقول صحيحة.",
      fr: "Aucun champ valide fourni.",
    },
    "Failed to update profile. Please try again later.": {
      en: "Failed to update profile. Please try again later.",
      ar: "فشل تحديث الملف الشخصي. يرجى المحاولة لاحقاً.",
      fr: "Échec de la mise à jour du profil. Veuillez réessayer plus tard.",
    },
    "Unknown error occurred.": {
      en: "An unexpected error occurred. Please try again.",
      ar: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
      fr: "Une erreur inattendue s'est produite. Veuillez réessayer.",
    },
  };

  // Check if the error message is in the translations
  for (const [key, translations] of Object.entries(errorTranslations)) {
    if (errorMessage.includes(key)) {
      return translations[locale] ?? translations.en;
    }
  }

  // Return original message if no translation found
  return errorMessage;
};

type AdminProfile = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN";
  status: "ACTIVE" | "PENDING" | "FLAGGED";
  createdAt: Date | string;
  hasPassword: boolean;
};

export function AdminProfilePanel({
  locale,
  initialAdmin,
}: {
  locale: Locale;
  initialAdmin: AdminProfile;
}) {
  const [admin, setAdmin] = useState(initialAdmin);
  const [name, setName] = useState(initialAdmin.name);
  const [email, setEmail] = useState(initialAdmin.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasPassword, setHasPassword] = useState(initialAdmin.hasPassword);
  const [pendingAction, setPendingAction] = useState<{ label: string } | null>(
    null,
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // If admin already has a password, require current password to change it.
    if (hasPassword && newPassword && !currentPassword) {
      toast.error(
        t(locale, {
          en: "Please enter your current password to change it.",
          ar: "يرجى إدخال كلمة المرور الحالية لتغييرها.",
          fr: "Veuillez entrer votre mot de passe actuel pour le modifier.",
        }),
      );
      return;
    }

    setPendingAction({
      label: t(locale, {
        en: "your profile",
        ar: "ملفك الشخصي",
        fr: "votre profil",
      }),
    });
  };

  const performSave = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        // Show the specific error message from the server
        const errorMessage =
          payload?.error || payload?.message || `Error: ${response.status}`;
        throw new Error(errorMessage);
      }

      const updated = payload?.data as AdminProfile | undefined;
      if (updated) {
        setAdmin(updated);
        setName(updated.name);
        setEmail(updated.email);
        setHasPassword(Boolean(updated.hasPassword));
      }
      setCurrentPassword("");
      setNewPassword("");
      setPendingAction(null);

      toast.success(
        t(locale, {
          en: "Profile updated successfully.",
          ar: "تم تحديث الملف الشخصي بنجاح.",
          fr: "Profil mis à jour avec succès.",
        }),
      );
    } catch (error) {
      console.error("Failed to update profile:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred.";
      const translatedError = getTranslatedErrorMessage(errorMessage, locale);
      toast.error(translatedError);
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  const createdAtText = new Date(admin.createdAt).toLocaleDateString(
    locale === "ar" ? "ar" : locale === "fr" ? "fr" : "en",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );

  const statusText =
    locale === "ar"
      ? admin.status === "ACTIVE"
        ? "نشط"
        : admin.status === "PENDING"
          ? "قيد الانتظار"
          : "معلّم"
      : locale === "fr"
        ? admin.status === "ACTIVE"
          ? "Actif"
          : admin.status === "PENDING"
            ? "En attente"
            : "Signalé"
        : admin.status;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
      <Card className="border-border/70 bg-card/70 backdrop-blur-sm">
        <CardHeader className="border-b border-border/60 pb-5">
          <CardTitle>
            {t(locale, { en: "Profile", ar: "الملف الشخصي", fr: "Profil" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin-name" className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-violet-500" />
                  {t(locale, { en: "Name", ar: "الاسم", fr: "Nom" })}
                </Label>
                <Input
                  id="admin-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="admin-email"
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
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11"
                  required
                />
              </div>
            </div>

            {hasPassword ? (
              <div className="space-y-2">
                <Label
                  htmlFor="admin-current-password"
                  className="flex items-center gap-2"
                >
                  <Lock className="h-4 w-4 text-violet-500" />
                  {t(locale, {
                    en: "Current password (required to change password)",
                    ar: "كلمة المرور الحالية (مطلوبة لتغيير كلمة المرور)",
                    fr: "Mot de passe actuel (requis pour modifier le mot de passe)",
                  })}
                </Label>
                <PasswordInput
                  id="admin-current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder={t(locale, {
                    en: "Enter your current password",
                    ar: "أدخل كلمة المرور الحالية",
                    fr: "Entrez votre mot de passe actuel",
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  {t(locale, {
                    en: "Only required if you want to change your password.",
                    ar: "مطلوب فقط إذا كنت تريد تغيير كلمة المرور.",
                    fr: "Obligatoire uniquement si vous souhaitez modifier votre mot de passe.",
                  })}
                </p>
                <Link
                  href={`/${locale}/forgot-password`}
                  className="text-xs font-medium text-violet-600 hover:underline dark:text-violet-300"
                >
                  {t(locale, {
                    en: "Forgot password?",
                    ar: "هل نسيت كلمة المرور؟",
                    fr: "Mot de passe oublié ?",
                  })}
                </Link>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label
                htmlFor="admin-password"
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
                id="admin-password"
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

      <Card className="border-border/70 bg-linear-to-b from-card to-muted/20">
        <CardHeader className="border-b border-border/60 pb-5">
          <CardTitle>
            {t(locale, {
              en: "Account info",
              ar: "معلومات الحساب",
              fr: "Informations du compte",
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6 text-sm">
          <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
            <div className="mb-1 text-muted-foreground">
              {t(locale, { en: "Status", ar: "الحالة", fr: "Statut" })}
            </div>
            <div>
              <Badge
                variant={admin.status === "ACTIVE" ? "accent" : "secondary"}
              >
                {statusText}
              </Badge>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
            <div className="mb-1 text-muted-foreground">
              {t(locale, {
                en: "Created at",
                ar: "تاريخ الإنشاء",
                fr: "Créé le",
              })}
            </div>
            <div className="font-medium">{createdAtText}</div>
          </div>
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
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t(locale, {
                  en: "Update",
                  ar: "تحديث",
                  fr: "Mettre à jour",
                })}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
