import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";
import { LoginFormClient } from "./login-form-client";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    error?: string;
    verified?: string;
    redirect?: string;
  }>;
}) {
  const { locale } = await params;
  const { error, verified, redirect } = await searchParams;
  const messages = getMessages(locale);
  const verifiedMessage =
    verified === "1"
      ? locale === "ar"
        ? "تم التحقق من بريدك الإلكتروني بنجاح. يمكنك تسجيل الدخول الآن."
        : locale === "fr"
          ? "Votre e-mail a été vérifié avec succès. Vous pouvez vous connecter maintenant."
          : "Your email has been verified successfully. You can sign in now."
      : null;
  const errorText =
    error === "missing_fields"
      ? locale === "ar"
        ? "يرجى إدخال البريد الإلكتروني وكلمة المرور."
        : locale === "fr"
          ? "Veuillez saisir votre e-mail et votre mot de passe."
          : "Please enter both email and password."
      : error === "invalid_credentials"
        ? locale === "ar"
          ? "بيانات تسجيل الدخول غير صحيحة."
          : locale === "fr"
            ? "E-mail ou mot de passe invalide."
            : "Invalid email or password."
        : null;

  return (
    <div className="grid w-full gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <div className="max-w-xl space-y-6">
        <div className="inline-flex rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm text-muted-foreground shadow-sm">
          {locale === "ar"
            ? "تسجيل الدخول الآمن"
            : locale === "fr"
              ? "Connexion sécurisée"
              : "Secure sign in"}
        </div>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          {messages.auth.loginTitle}
        </h1>
        <p className="text-lg leading-8 text-muted-foreground">
          {messages.auth.loginDescription}
        </p>
      </div>

      <Card className="glass mx-auto w-full max-w-lg border-border/70">
        <CardHeader>
          <CardTitle>{messages.auth.loginTitle}</CardTitle>
          <CardDescription>{messages.auth.loginDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {verifiedMessage ? (
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
              {verifiedMessage}
            </div>
          ) : null}
          <LoginFormClient
            locale={locale}
            messages={messages}
            initialErrorText={errorText}
            redirectTo={redirect}
          />
          <p className="text-center text-sm text-muted-foreground">
            {messages.auth.noAccount}{" "}
            <Link
              href={`/${locale}/register`}
              className="font-medium text-violet-600 hover:underline dark:text-violet-300"
            >
              {messages.nav.register}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
