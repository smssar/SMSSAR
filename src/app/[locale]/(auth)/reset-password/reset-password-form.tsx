"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import ClientSubmitButton from "@/components/auth/client-submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const getErrorMessage = (errorKey: string, locale: string): string => {
  const errors: Record<string, Record<string, string>> = {
    password_required: {
      en: "Password is required.",
      ar: "كلمة المرور مطلوبة.",
      fr: "Le mot de passe est requis.",
    },
    confirm_password_required: {
      en: "Please confirm your password.",
      ar: "يرجى تأكيد كلمة المرور.",
      fr: "Veuillez confirmer votre mot de passe.",
    },
    password_mismatch: {
      en: "Passwords do not match.",
      ar: "كلمات المرور غير متطابقة.",
      fr: "Les mots de passe ne correspondent pas.",
    },
    password_too_short: {
      en: "Password must be at least 8 characters long.",
      ar: "يجب أن تكون كلمة المرور 8 أحرف على الأقل.",
      fr: "Le mot de passe doit comporter au moins 8 caractères.",
    },
    invalid_token: {
      en: "Reset link has expired or is invalid. Please request a new password reset.",
      ar: "انتهت صلاحية رابط إعادة تعيين أو أنه غير صحيح. يرجى طلب إعادة تعيين كلمة المرور.",
      fr: "Le lien de réinitialisation a expiré ou est invalide. Veuillez demander une nouvelle réinitialisation.",
    },
    user_not_found: {
      en: "User not found. Please try registering or requesting a password reset.",
      ar: "لم يتم العثور على المستخدم. يرجى محاولة التسجيل أو طلب إعادة تعيين كلمة المرور.",
      fr: "Utilisateur non trouvé. Veuillez essayer de vous inscrire ou de demander une réinitialisation.",
    },
    server_error: {
      en: "Server error. Please try again later.",
      ar: "خطأ في الخادم. يرجى المحاولة لاحقاً.",
      fr: "Erreur serveur. Veuillez réessayer plus tard.",
    },
    network_error: {
      en: "Network error. Please check your connection and try again.",
      ar: "خطأ في الشبكة. يرجى التحقق من الاتصال والمحاولة مرة أخرى.",
      fr: "Erreur réseau. Veuillez vérifier votre connexion et réessayer.",
    },
  };

  return (
    errors[errorKey]?.[locale as keyof (typeof errors)[string]] ||
    errors[errorKey]?.en ||
    errorKey
  );
};

export default function ResetPasswordClientForm({
  email = "",
  token = "",
  locale = "en",
}: {
  email?: string;
  token?: string;
  locale?: string;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  const validateForm = (): boolean => {
    // Check if passwords are provided
    if (!password.trim()) {
      const err = getErrorMessage("password_required", locale);
      setError(err);
      toast.error(err);
      return false;
    }

    if (!confirmPassword.trim()) {
      const err = getErrorMessage("confirm_password_required", locale);
      setError(err);
      toast.error(err);
      return false;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      const err = getErrorMessage("password_mismatch", locale);
      setError(err);
      toast.error(err);
      return false;
    }

    // Check password length
    if (password.length < 8) {
      const err = getErrorMessage("password_too_short", locale);
      setError(err);
      toast.error(err);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/${locale}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password, confirmPassword }),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        let errorMsg = payload?.error || payload?.message;

        // Map server errors to user-friendly messages
        if (errorMsg?.includes("invalid") || errorMsg?.includes("expired")) {
          errorMsg = getErrorMessage("invalid_token", locale);
        } else if (errorMsg?.includes("not found")) {
          errorMsg = getErrorMessage("user_not_found", locale);
        } else if (!errorMsg) {
          errorMsg = getErrorMessage("server_error", locale);
        }

        setError(errorMsg);
        toast.error(errorMsg);
        setLoading(false);
        return;
      }

      toast.success(
        locale === "ar"
          ? "تم تحديث كلمة المرور بنجاح!"
          : locale === "fr"
            ? "Mot de passe mis à jour avec succès!"
            : "Password updated successfully!",
      );

      const redirectTo = payload?.redirect || `/${locale}/login?reset=1`;
      router.push(redirectTo);
    } catch (err) {
      console.error(err);
      const errorMsg = getErrorMessage("network_error", locale);
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <input type="hidden" name="email" value={email ?? ""} />
      <input type="hidden" name="token" value={token ?? ""} />

      {error && (
        <Alert
          variant="destructive"
          className="border-red-500/40 bg-red-500/10"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">
          {locale === "ar"
            ? "كلمة المرور (8 أحرف على الأقل)"
            : locale === "fr"
              ? "Mot de passe (minimum 8 caractères)"
              : "Password (minimum 8 characters)"}
        </Label>
        <PasswordInput
          id="password"
          name="password"
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError("");
          }}
          placeholder={
            locale === "ar"
              ? "أدخل كلمة المرور"
              : locale === "fr"
                ? "Entrez le mot de passe"
                : "Enter password"
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">
          {locale === "ar"
            ? "تأكيد كلمة المرور"
            : locale === "fr"
              ? "Confirmer le mot de passe"
              : "Confirm password"}
        </Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          required
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (error) setError("");
          }}
          placeholder={
            locale === "ar"
              ? "تأكيد كلمة المرور"
              : locale === "fr"
                ? "Confirmez le mot de passe"
                : "Confirm password"
          }
        />
      </div>

      <ClientSubmitButton className="w-full" type="submit" disabled={loading}>
        {loading
          ? locale === "ar"
            ? "جاري التحديث..."
            : locale === "fr"
              ? "Mise à jour..."
              : "Updating..."
          : locale === "ar"
            ? "تحديث"
            : locale === "fr"
              ? "Mettre à jour"
              : "Update"}
      </ClientSubmitButton>
    </form>
  );
}
