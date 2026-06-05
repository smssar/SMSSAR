import Link from "next/link";
import { CheckCircle2, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/locales";
import { getMessages } from "@/lib/messages";
import { resendVerificationAction, verifyEmailAction } from "./actions";

export default async function VerifyEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ email?: string; error?: string; sent?: string }>;
}) {
  const { locale } = await params;
  const { email, error, sent } = await searchParams;
  const messages = getMessages(locale);

  const errorText =
    error === "missing_fields"
      ? locale === "ar"
        ? "يرجى إدخال البريد الإلكتروني والرمز."
        : locale === "fr"
          ? "Veuillez saisir l'e-mail et le code."
          : "Please enter both email and code."
      : error === "invalid_code"
        ? locale === "ar"
          ? "الرمز غير صحيح أو منتهي الصلاحية."
          : locale === "fr"
            ? "Le code est invalide ou expiré."
            : "The code is invalid or expired."
        : null;

  return (
    <div className="mx-auto w-full max-w-lg">
      <Card className="glass border-border/70">
        <CardHeader>
          <CardTitle>
            {locale === "ar"
              ? "تحقق من بريدك الإلكتروني"
              : locale === "fr"
                ? "Vérifiez votre e-mail"
                : "Verify your email"}
          </CardTitle>
          <CardDescription>
            {locale === "ar"
              ? "أدخل الرمز المرسل إلى بريدك الإلكتروني لتفعيل الحساب."
              : locale === "fr"
                ? "Saisissez le code envoyé à votre e-mail pour activer votre compte."
                : "Enter the code sent to your email to activate your account."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {sent ? (
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
              {locale === "ar"
                ? "تم إرسال رمز التحقق مرة أخرى."
                : locale === "fr"
                  ? "Le code de vérification a été renvoyé."
                  : "Verification code sent again."}
            </div>
          ) : null}
          {errorText ? (
            <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {errorText}
            </div>
          ) : null}

          <form
            action={async (formData) => {
              "use server";
              await verifyEmailAction(formData, locale);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">{messages.auth.email}</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-4" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={email ?? ""}
                  placeholder="name@example.com"
                  className="pl-11 rtl:pr-11 rtl:pl-4 bg-muted/50 cursor-not-allowed"
                  readOnly
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">
                {locale === "ar"
                  ? "رمز التحقق"
                  : locale === "fr"
                    ? "Code de vérification"
                    : "Verification code"}
              </Label>
              <Input
                id="code"
                name="code"
                inputMode="numeric"
                placeholder="123456"
                maxLength={6}
                required
              />
            </div>
            <Button type="submit" variant="accent" className="w-full">
              <CheckCircle2 className="h-4 w-4" />
              {locale === "ar"
                ? "تحقق"
                : locale === "fr"
                  ? "Vérifier"
                  : "Verify"}
            </Button>
          </form>

          <form
            action={async (formData) => {
              "use server";
              await resendVerificationAction(formData, locale);
            }}
            className="space-y-3"
          >
            <input type="hidden" name="email" value={email ?? ""} />
            <Button type="submit" variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4" />
              {locale === "ar"
                ? "إعادة إرسال الرمز"
                : locale === "fr"
                  ? "Renvoyer le code"
                  : "Resend code"}
            </Button>
          </form>

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
