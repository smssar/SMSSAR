"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/locales";

export function BecomeSellerButton({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [phone, setPhone] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const text = {
    title:
      locale === "ar"
        ? "التحول إلى بائع"
        : locale === "fr"
          ? "Devenir vendeur"
          : "Become a seller",
    message:
      locale === "ar"
        ? "أدخل رقم هاتفك لتفعيل حساب البائع."
        : locale === "fr"
          ? "Entrez votre numero de telephone pour activer votre compte vendeur."
          : "Enter your phone number to activate your seller account.",
    phone:
      locale === "ar"
        ? "رقم الهاتف"
        : locale === "fr"
          ? "Numero de telephone"
          : "Phone number",
    placeholder: "+971 50 000 0000",
    cancel: locale === "ar" ? "إلغاء" : locale === "fr" ? "Annuler" : "Cancel",
    confirm:
      locale === "ar"
        ? "تأكيد التحول"
        : locale === "fr"
          ? "Confirmer"
          : "Confirm",
    invalid:
      locale === "ar"
        ? "يرجى إدخال رقم هاتف صحيح."
        : locale === "fr"
          ? "Veuillez saisir un numero de telephone valide."
          : "Please enter a valid phone number.",
    failed:
      locale === "ar"
        ? "تعذر التحويل إلى بائع. حاول مرة أخرى."
        : locale === "fr"
          ? "Impossible de devenir vendeur. Veuillez reessayer."
          : "Failed to become seller. Please try again.",
  };

  async function handleConfirm() {
    if (phone.trim().length < 6) {
      setError(text.invalid);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/users/become-seller", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(payload?.error ?? text.failed);
        setLoading(false);
        return;
      }

      setOpen(false);
      setLoading(false);
      router.replace(`/${locale}/dashboard/seller`);
      router.refresh();
    } catch {
      setError(text.failed);
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="lg" onClick={() => setOpen(true)}>
        {text.title}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={() => {
              if (!loading) {
                setOpen(false);
                setError(null);
              }
            }}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border/70 bg-background p-6 shadow-2xl">
            <h3 className="text-lg font-semibold tracking-tight">
              {text.title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{text.message}</p>

            <div className="mt-4 space-y-2">
              <Label htmlFor="become-seller-phone">{text.phone}</Label>
              <Input
                id="become-seller-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder={text.placeholder}
                className="h-11"
                disabled={loading}
              />
            </div>

            {error ? (
              <div className="mt-3 rounded-lg border border-rose-300/60 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-700/60 dark:bg-rose-900/20 dark:text-rose-300">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  setError(null);
                }}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {text.cancel}
              </Button>
              <Button
                variant="accent"
                onClick={handleConfirm}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? `${text.confirm}...` : text.confirm}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
