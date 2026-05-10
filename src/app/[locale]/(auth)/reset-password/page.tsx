import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// Inputs are handled in the client form component
import type { Locale } from "@/lib/locales";
import { getMessages } from "@/lib/messages";
import ResetPasswordClientForm from "./reset-password-form";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ email?: string; token?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { email, token, error } = await searchParams;
  const messages = getMessages(locale);

  const errorText =
    error === "invalid_token"
      ? locale === "ar"
        ? "الرابط غير صالح أو منتهي الصلاحية."
        : locale === "fr"
          ? "Le lien est invalide ou expiré."
          : "The link is invalid or expired."
      : null;

  return (
    <div className="mx-auto w-full max-w-lg">
      <Card className="glass border-border/70">
        <CardHeader>
          <CardTitle>
            {locale === "ar"
              ? "إعادة تعيين كلمة المرور"
              : locale === "fr"
                ? "Réinitialiser le mot de passe"
                : "Reset password"}
          </CardTitle>
          <CardDescription>
            {locale === "ar"
              ? "أدخل كلمة المرور الجديدة لتحديث حسابك."
              : locale === "fr"
                ? "Entrez un nouveau mot de passe pour mettre à jour votre compte."
                : "Enter a new password to update your account."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {errorText ? (
            <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {errorText}
            </div>
          ) : null}

          <ResetPasswordClientForm
            email={email ?? ""}
            token={token ?? ""}
            locale={locale}
          />

          <p className="text-center text-sm text-muted-foreground">
            <Link
              href={`/${locale}/login`}
              className="font-medium text-violet-600 hover:underline dark:text-violet-300"
            >
              {messages.auth.haveAccount}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
