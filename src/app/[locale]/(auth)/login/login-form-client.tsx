"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/locales";
import type { Messages } from "@/lib/messages";

export function LoginFormClient({
  locale,
  messages,
  initialErrorText,
}: {
  locale: Locale;
  messages: Messages;
  initialErrorText: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(initialErrorText);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorText(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email")?.toString().trim().toLowerCase();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      setErrorText(
        locale === "ar"
          ? "يرجى إدخال البريد الإلكتروني وكلمة المرور."
          : "Please enter both email and password.",
      );
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      const statusResponse = await fetch(
        `/api/auth/verification-status?email=${encodeURIComponent(email)}`,
        { cache: "no-store" },
      );

      if (statusResponse.ok) {
        const status = (await statusResponse.json()) as {
          exists?: boolean;
          verified?: boolean;
        };

        if (status.exists && !status.verified) {
          router.push(
            `/${locale}/verify-email?email=${encodeURIComponent(email)}`,
          );
          setLoading(false);
          return;
        }
      }

      setErrorText(
        locale === "ar"
          ? "بيانات تسجيل الدخول غير صحيحة."
          : "Invalid email or password.",
      );
      setLoading(false);
      return;
    }

    const sessionResponse = await fetch("/api/auth/session", {
      cache: "no-store",
    });

    const session = (await sessionResponse.json()) as {
      user?: { role?: "USER" | "SELLER" | "ADMIN" };
    };

    const nextPath =
      session.user?.role === "ADMIN"
        ? `/${locale}/dashboard/admin`
        : session.user?.role === "SELLER"
          ? `/${locale}/dashboard/seller`
          : `/${locale}/dashboard/profile`;

    router.replace(nextPath);
    router.refresh();
  };

  return (
    <>
      {errorText ? (
        <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {errorText}
        </div>
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">{messages.auth.email}</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-4" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              className="pl-11 rtl:pr-11 rtl:pl-4"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{messages.auth.password}</Label>
          <PasswordInput id="password" name="password" required />
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4 rounded border-border" />
            {messages.auth.rememberMe}
          </label>
          <Link
            href={`/${locale}/forgot-password`}
            className="font-medium text-violet-600 hover:underline dark:text-violet-300"
          >
            {messages.auth.forgotTitle}
          </Link>
        </div>

        <Button
          type="submit"
          variant="accent"
          className="w-full cursor-pointer hover:opacity-80 hover:scale-99"
          disabled={loading}
        >
          {loading
            ? locale === "ar"
              ? "جاري تسجيل الدخول..."
              : "Signing in..."
            : messages.nav.login}
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          )}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-card px-2 text-muted-foreground">
              {locale === "ar" ? "أو" : "or"}
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full cursor-pointer flex items-center justify-center gap-3 bg-white text-slate-800 border border-border hover:shadow-md transition-transform disabled:opacity-60"
          onClick={() => {
            setLoading(true);
            // Let NextAuth handle the redirect automatically
            void signIn("google");
          }}
          disabled={loading}
        >
          <svg className="h-5 w-5" viewBox="0 0 533.5 544.3" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M533.5 278.4c0-18.8-1.5-37-4.3-54.6H272.1v103.4h147.3c-6.3 34.1-25.1 62.9-53.6 82v68.1h86.5c50.6-46.6 80.2-115.5 80.2-199z"
            />
            <path
              fill="#34A853"
              d="M272.1 544.3c72.6 0 133.6-24.1 178-65.6l-86.5-68.1c-24.1 16.2-55 25.7-91.5 25.7-70.4 0-130-47.4-151.2-111.4H29.4v69.8C73.7 486.6 167.4 544.3 272.1 544.3z"
            />
            <path
              fill="#FBBC05"
              d="M120.9 323.0c-10.8-32.4-10.8-67.3 0-99.7V153.5H29.4c-40.3 78.1-40.3 171.2 0 249.3l91.5-79.8z"
            />
            <path
              fill="#EA4335"
              d="M272.1 109.6c39.6 0 75.2 13.6 103.3 40.3l77.4-77.4C420.4 24.1 359.4 0 272.1 0 167.4 0 73.7 57.7 29.4 153.5l91.5 69.8c21.2-64 80.8-111.4 151.2-111.4z"
            />
          </svg>

          <span className="font-medium">
            {locale === "ar"
              ? "تسجيل الدخول باستخدام Google"
              : "Sign in with Google"}
          </span>
        </Button>
      </form>
    </>
  );
}
