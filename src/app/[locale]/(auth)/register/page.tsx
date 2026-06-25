import Link from "next/link";
import { Mail, Lock, UserRound } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";
import { registerAction } from "./actions";
import { RegisterSubmitButton } from "./register-submit-button";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import { RegisterFields } from "./register-fields";

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    error?: string;
    role?: string;
    name?: string;
    email?: string;
    phone?: string;
  }>;
}) {
  const { locale } = await params;
  const { error, name, email, phone } = await searchParams;
  const messages = getMessages(locale);
  const initialRole = "user";

  const t = (en: string, ar: string, fr: string) =>
    locale === "ar" ? ar : locale === "fr" ? fr : en;

  const errorText =
    error === "missing_fields"
      ? t(
          "Please complete all required fields.",
          "يرجى تعبئة جميع الحقول المطلوبة.",
          "Veuillez remplir tous les champs requis.",
        )
      : error === "weak_password"
        ? t(
            "Password must be at least 8 characters long.",
            "يجب أن تكون كلمة المرور 8 أحرف على الأقل.",
            "Le mot de passe doit comporter au moins 8 caractères.",
          )
        : error === "password_mismatch"
          ? t(
              "Password and confirmation do not match.",
              "كلمتا المرور غير متطابقتين.",
              "Les mots de passe ne correspondent pas.",
            )
          : error === "seller_phone_required"
            ? t(
                "Phone number is required for seller accounts.",
                "رقم الهاتف مطلوب عند اختيار حساب بائع.",
                "Le numéro de téléphone est requis pour un compte vendeur.",
              )
            : error === "invalid_phone"
              ? t(
                  "Please enter a valid phone number.",
                  "يرجى إدخال رقم هاتف صالح.",
                  "Veuillez saisir un numéro de téléphone valide.",
                )
            : error === "email_exists"
              ? t(
                  "An account with this email already exists.",
                  "يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل.",
                  "Un compte existe déjà avec cet e-mail.",
                )
              : error === "terms_required"
                ? t(
                    "You must accept the Privacy Policy to create an account.",
                    "يجب الموافقة على سياسة الخصوصية لإنشاء حساب.",
                    "Vous devez accepter la Politique de Confidentialité pour créer un compte.",
                  )
                : error === "server_error"
                  ? t(
                      "Something went wrong. Please try again.",
                      "حدث خطأ غير متوقع. حاول مرة أخرى.",
                      "Une erreur inattendue s'est produite. Veuillez réessayer.",
                    )
                  : null;

  return (
    <div className="grid w-full gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <div className="max-w-xl space-y-6">
        <div className="inline-flex rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm text-muted-foreground shadow-sm">
          {t(
            "Get started in under a minute",
            "ابدأ خلال دقيقة",
            "Commencez en une minute",
          )}
        </div>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          {messages.auth.registerTitle}
        </h1>
        <p className="text-lg leading-8 text-muted-foreground">
          {messages.auth.registerDescription}
        </p>
      </div>

      <Card className="glass mx-auto w-full max-w-lg border-border/70">
        <CardHeader>
          <CardTitle>{messages.auth.registerTitle}</CardTitle>
          <CardDescription>{messages.auth.registerDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {errorText ? (
            <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {errorText}
            </div>
          ) : null}
          <form
            action={async (formData) => {
              "use server";
              formData.set(
                "agreedToTerms",
                formData.get("agreedToTerms") === "on" ? "true" : "",
              );
              await registerAction(formData, locale);
            }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="name">
                {messages.auth.fullName}
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-4" />
                <Input
                  id="name"
                  name="name"
                  placeholder={t("John Doe", "محمد أحمد", "Jean Dupont")}
                  defaultValue={name ?? undefined}
                  className="h-11 rounded-2xl border-border/70 bg-background/80 pl-11 shadow-sm transition focus-visible:border-violet-500 focus-visible:ring-violet-500 rtl:pr-11 rtl:pl-4"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                {messages.auth.email}
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-4" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  defaultValue={email ?? undefined}
                  className="h-11 rounded-2xl border-border/70 bg-background/80 pl-11 shadow-sm transition focus-visible:border-violet-500 focus-visible:ring-violet-500 rtl:pr-11 rtl:pl-4"
                  required
                />
              </div>
            </div>

            <RegisterFields
              locale={locale}
              initialRole={initialRole}
              initialPhone={phone}
            />

            <div className="space-y-2">
              <Label htmlFor="password">
                {messages.auth.password}
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-4" />
                <PasswordInput
                  id="password"
                  name="password"
                  minLength={8}
                  required
                  className="h-11 rounded-2xl border-border/70 bg-background/80 pl-11 shadow-sm transition focus-visible:border-violet-500 focus-visible:ring-violet-500 rtl:pr-11 rtl:pl-4"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">
                {messages.auth.confirmPassword}
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-4" />
                <PasswordInput
                  id="confirm"
                  name="confirmPassword"
                  required
                  className="h-11 rounded-2xl border-border/70 bg-background/80 pl-11 shadow-sm transition focus-visible:border-violet-500 focus-visible:ring-violet-500 rtl:pr-11 rtl:pl-4"
                />
              </div>
            </div>

            {/* Privacy Policy consent */}
            <div className="rounded-2xl border border-violet-500/15 bg-violet-500/5 p-4 ring-1 ring-violet-500/8">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="agreedToTerms"
                  name="agreedToTerms"
                  required
                  className="mt-0.5 h-5 w-5 shrink-0 rounded-md border-violet-400 data-[state=checked]:bg-violet-600 data-[state=checked]:text-white"
                />
                <Label
                  htmlFor="agreedToTerms"
                  className="cursor-pointer text-sm leading-relaxed text-muted-foreground"
                >
                  {t("I agree to the ", "أوافق على ", "J'accepte la ")}
                  <Link
                    href={`/${locale}/privacy-policy`}
                    target="_blank"
                    className="font-medium text-violet-600 underline-offset-2 hover:underline dark:text-violet-400"
                  >
                    {t(
                      "Privacy Policy",
                      "سياسة الخصوصية",
                      "Politique de Confidentialité",
                    )}
                  </Link>
                </Label>
              </div>
            </div>

            <RegisterSubmitButton
              label={messages.nav.register}
              loadingLabel={t(
                "Creating account...",
                "جاري إنشاء الحساب...",
                "Création du compte...",
              )}
            />
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-2 text-muted-foreground">
                {t("or", "أو", "ou")}
              </span>
            </div>
          </div>

          <GoogleSignInButton
            locale={locale}
            callbackUrl={`/${locale}/dashboard/profile`}
          />

          <p className="text-center text-sm text-muted-foreground">
            {messages.auth.haveAccount}{" "}
            <Link
              href={`/${locale}/login`}
              className="font-medium text-violet-600 hover:underline dark:text-violet-300"
            >
              {messages.nav.login}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
