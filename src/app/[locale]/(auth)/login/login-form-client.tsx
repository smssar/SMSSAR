"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Lock, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
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
      setErrorText(
        locale === "ar"
          ? "بيانات تسجيل الدخول غير صحيحة."
          : "Invalid email or password.",
      );
      setLoading(false);
      return;
    }

    router.replace(`/${locale}/dashboard`);
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
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-4" />
            <Input
              id="password"
              name="password"
              type="password"
              className="pl-11 rtl:pr-11 rtl:pl-4"
              required
            />
          </div>
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
      </form>
    </>
  );
}
