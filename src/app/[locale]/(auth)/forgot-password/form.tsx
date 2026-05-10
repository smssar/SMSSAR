"use client";

import { useState, useEffect, useRef } from "react";
import { Mail, Loader2, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Locale } from "@/lib/locales";

const COOLDOWN_KEY = "forgot_password_cooldown";
const COOLDOWN_DURATION = 60; // 1 minute in seconds

export function ForgotPasswordForm({
  locale,
  emailLabel,
  resetLabel,
}: {
  locale: Locale;
  emailLabel: string;
  resetLabel: string;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const initializedRef = useRef(false);

  // Initialize hydration and restore cooldown from localStorage
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Use Promise.resolve().then() to defer state updates
    Promise.resolve().then(() => {
      setIsHydrated(true);

      const storedCooldownEnd = localStorage.getItem(COOLDOWN_KEY);
      if (storedCooldownEnd) {
        const endTime = parseInt(storedCooldownEnd, 10);
        const now = Date.now();
        const remainingTime = Math.max(0, Math.ceil((endTime - now) / 1000));

        if (remainingTime > 0) {
          setCooldown(remainingTime);
          setSubmitted(true);
        } else {
          localStorage.removeItem(COOLDOWN_KEY);
        }
      }
    });
  }, []);

  // Handle cooldown countdown
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (cooldown === 0 && submitted) {
      // When cooldown reaches 0, auto-clear submitted state after a short delay
      const timer = setTimeout(() => {
        setSubmitted(false);
        localStorage.removeItem(COOLDOWN_KEY);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [cooldown, submitted]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      toast.error(
        locale === "ar"
          ? "الرجاء إدخال عنوان بريد إلكتروني"
          : locale === "fr"
            ? "Veuillez entrer une adresse e-mail"
            : "Please enter an email address",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, locale }),
      });

      if (!response.ok) {
        throw new Error("Failed to send reset link");
      }

      setSubmitted(true);
      setEmail("");
      setCooldown(COOLDOWN_DURATION);

      // Store cooldown end time in localStorage
      const endTime = Date.now() + COOLDOWN_DURATION * 1000;
      localStorage.setItem(COOLDOWN_KEY, endTime.toString());

      toast.success(
        locale === "ar"
          ? "تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني"
          : locale === "fr"
            ? "Le lien de réinitialisation a été envoyé à votre e-mail"
            : "Reset link sent to your email",
      );

      // Auto-clear submitted message after 5 seconds
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error("Failed to send reset link:", error);
      toast.error(
        locale === "ar"
          ? "فشل الإرسال. يرجى المحاولة مرة أخرى"
          : locale === "fr"
            ? "Impossible d'envoyer. Veuillez réessayer"
            : "Failed to send. Please try again",
      );
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || cooldown > 0;
  const minutes = Math.floor(cooldown / 60);
  const seconds = cooldown % 60;
  const timerText =
    cooldown > 0
      ? `${minutes}:${seconds.toString().padStart(2, "0")}`
      : resetLabel;

  // Prevent hydration mismatch
  if (!isHydrated) {
    return null;
  }

  return (
    <>
      {submitted && cooldown > 0 && (
        <div className="space-y-3 rounded-2xl border border-emerald-500/30 bg-linear-to-br from-emerald-500/10 to-emerald-500/5 px-4 py-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              {locale === "ar"
                ? "تم إرسال الرابط بنجاح!"
                : locale === "fr"
                  ? "Lien envoyé avec succès !"
                  : "Link sent successfully!"}
            </p>
          </div>
          <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70">
            {locale === "ar"
              ? "تحقق من بريدك الإلكتروني للحصول على رابط إعادة تعيين كلمة المرور. قد يستغرق بضع ثوان للوصول."
              : locale === "fr"
                ? "Vérifiez votre e-mail pour le lien de réinitialisation du mot de passe. Cela peut prendre quelques secondes."
                : "Check your email for the password reset link. It may take a few seconds to arrive."}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="forgot-email">{emailLabel}</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-4" />
            <Input
              id="forgot-email"
              name="email"
              type="email"
              placeholder="name@example.com"
              className="pl-11 rtl:pr-11 rtl:pl-4"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isDisabled}
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="accent"
          className="relative w-full overflow-hidden transition-all duration-300"
          disabled={isDisabled}
        >
          <span
            className={`inline-flex items-center gap-2 transition-all duration-300 ${
              loading ? "opacity-0" : "opacity-100"
            }`}
          >
            {cooldown > 0 ? (
              <>
                <span className="font-mono text-sm font-semibold">
                  {timerText}
                </span>
              </>
            ) : (
              <>
                {resetLabel}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </>
            )}
          </span>

          {loading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
            </span>
          )}
        </Button>

        {cooldown > 0 && (
          <p className="text-center text-xs text-muted-foreground">
            {locale === "ar"
              ? `يمكنك إرسال رابط جديد بعد ${minutes}:${seconds.toString().padStart(1, "0")}`
              : locale === "fr"
                ? `Veuillez attendre ${minutes}:${seconds.toString().padStart(1, "0")} avant de réessayer`
                : `Please wait ${minutes}:${seconds.toString().padStart(1, "0")} before retrying`}
          </p>
        )}
      </form>
    </>
  );
}
