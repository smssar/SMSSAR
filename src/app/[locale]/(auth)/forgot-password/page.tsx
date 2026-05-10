import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getMessages } from "@/lib/messages";
import { ForgotPasswordForm } from "./form";
import type { Locale } from "@/lib/locales";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const messages = getMessages(locale);

  const title =
    locale === "ar"
      ? "إعادة تعيين كلمة المرور"
      : locale === "fr"
        ? "Réinitialiser votre mot de passe"
        : messages.auth.forgotTitle;

  const description =
    locale === "ar"
      ? "سنرسل رابط إعادة التعيين إلى بريدك الإلكتروني."
      : locale === "fr"
        ? "Entrez votre adresse e-mail pour recevoir un lien de réinitialisation."
        : messages.auth.forgotDescription;

  const emailLabel = locale === "fr" ? "Adresse e-mail" : messages.auth.email;

  const resetLabel =
    locale === "ar"
      ? "إرسال رابط إعادة التعيين"
      : locale === "fr"
        ? "Envoyer le lien de réinitialisation"
        : messages.auth.resetLink;

  const haveAccount =
    locale === "ar"
      ? "لديك حساب بالفعل؟"
      : locale === "fr"
        ? "Vous avez déjà un compte ?"
        : messages.auth.haveAccount;

  return (
    <div className="mx-auto w-full max-w-lg">
      <Card className="glass border-border/70">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <ForgotPasswordForm
            locale={locale}
            emailLabel={emailLabel}
            resetLabel={resetLabel}
          />

          <div className="flex flex-wrap items-center justify-center gap-1 text-sm text-muted-foreground">
            <span>{haveAccount}</span>
            <Link
              href={`/${locale}/login`}
              className="font-medium text-violet-600 hover:underline dark:text-violet-400"
            >
              {locale === "ar"
                ? "تسجيل الدخول"
                : locale === "fr"
                  ? "Se connecter"
                  : "Sign In"}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
