"use client";

import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Messages } from "@/lib/messages";

export type PaymentCopy = Messages["payment"];

export type PaymentFormProps = {
  copy: PaymentCopy;
  planId: string;
  amount?: string;
  planName?: string;
  className?: string;
};

const methodIcons = {
  card: CreditCard,
  wallet: Wallet,
} as const;

const visibleMethods = ["card", "wallet"] as const;

export function PaymentForm({
  copy,
  planId,
  amount = "1,250 DH",
  planName = "Premium listing package",
  className,
}: PaymentFormProps) {
  const [method, setMethod] =
    useState<keyof PaymentCopy["form"]["methods"]>("card");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!planId) {
      toast.error("Plan is missing.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = {
      planId,
      paymentMethod: method,
      cardholder: String(formData.get("cardholder") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      address: String(formData.get("address") ?? "").trim(),
      city: String(formData.get("city") ?? "").trim(),
      country: String(formData.get("country") ?? "").trim(),
      zip: String(formData.get("zip") ?? "").trim(),
      notes: String(formData.get("notes") ?? "").trim(),
    };

    if (!payload.cardholder || !payload.email) {
      toast.error("Cardholder name and email are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/payments/dodo-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Checkout failed");
      }

      if (!result.checkoutUrl) {
        throw new Error("Missing checkout URL");
      }

      window.location.href = result.checkoutUrl;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start checkout",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card
      className={
        className ??
        "overflow-hidden border-border/70 bg-background/95 shadow-[0_28px_90px_-35px_rgba(15,23,42,0.45)]"
      }
    >
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden border-b border-border/60 lg:border-b-0 lg:border-r">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.14),transparent_28%),linear-gradient(to_bottom,rgba(248,250,252,0.98),rgba(248,250,252,0.92))] dark:bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_28%),linear-gradient(to_bottom,rgba(15,23,42,0.94),rgba(15,23,42,0.88))]" />
          <div className="relative p-6 lg:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300">
              <Star className="h-3.5 w-3.5" />
              {copy.securityBadge}
            </div>

            <div className="mt-6 space-y-3">
              <CardTitle className="text-3xl leading-tight sm:text-4xl">
                {copy.title}
              </CardTitle>
              <CardDescription className="max-w-xl text-base leading-7">
                {copy.description}
              </CardDescription>
            </div>

            <div className="mt-8 rounded-3xl border border-border/60 bg-background/80 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    {copy.summaryTitle}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight">
                    {planName}
                  </h3>
                </div>
                <div className="rounded-2xl bg-violet-500/10 px-4 py-2 text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {copy.totalLabel}
                  </p>
                  <p className="text-2xl font-semibold text-violet-700 dark:text-violet-300">
                    {amount}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {copy.perks.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 px-4 py-3 text-sm text-muted-foreground"
                  >
                    <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {copy.trustCards.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border/60 bg-background/80 p-4"
                >
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <LockKeyhole className="h-3.5 w-3.5" />
                    {item.eyebrow}
                  </div>
                  <p className="mt-2 text-sm font-medium">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <form className="space-y-6 p-6 lg:p-8" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Label className="text-sm font-medium">{copy.methodTitle}</Label>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-700 shadow-sm shadow-emerald-500/10 ring-1 ring-inset ring-white/40 backdrop-blur dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-white/10">
                <ShieldCheck className="h-3.5 w-3.5" />
                {copy.securityBadge}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {visibleMethods.map((methodKey) => {
                const label = copy.form.methods[methodKey];
                const Icon = methodIcons[methodKey];
                const active = method === methodKey;

                return (
                  <button
                    key={methodKey}
                    type="button"
                    onClick={() => setMethod(methodKey)}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                      active
                        ? "border-violet-500/40 bg-violet-500/10 shadow-sm"
                        : "border-border/70 bg-background hover:bg-muted/40"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? "bg-violet-500 text-white" : "bg-muted text-foreground"}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-xs text-muted-foreground">
                        {active ? copy.methodSelected : copy.methodHint}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="payment-cardholder">{copy.form.cardholder}</Label>
              <Input
                id="payment-cardholder"
                name="cardholder"
                placeholder={copy.form.cardholderPlaceholder}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="payment-card-number">
                {copy.form.cardNumber}
              </Label>
              <Input
                id="payment-card-number"
                name="cardNumber"
                inputMode="numeric"
                placeholder={copy.form.cardNumberPlaceholder}
                autoComplete="cc-number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-expiry">{copy.form.expiry}</Label>
              <Input
                id="payment-expiry"
                name="expiry"
                placeholder={copy.form.expiryPlaceholder}
                autoComplete="cc-exp"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-cvc">{copy.form.cvc}</Label>
              <Input
                id="payment-cvc"
                name="cvc"
                inputMode="numeric"
                placeholder={copy.form.cvcPlaceholder}
                autoComplete="cc-csc"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="payment-email">{copy.form.email}</Label>
              <Input
                id="payment-email"
                name="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="payment-address">{copy.form.address}</Label>
              <Textarea
                id="payment-address"
                name="address"
                placeholder={copy.form.addressPlaceholder}
                className="min-h-24"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-city">{copy.form.city}</Label>
              <Input
                id="payment-city"
                name="city"
                placeholder={copy.form.cityPlaceholder}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-country">{copy.form.country}</Label>
              <Select id="payment-country" name="country" defaultValue="">
                <option value="" disabled>
                  {copy.form.countryPlaceholder}
                </option>
                {copy.form.countries.map((country) => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-zip">{copy.form.zip}</Label>
              <Input
                id="payment-zip"
                name="zip"
                placeholder={copy.form.zipPlaceholder}
                inputMode="numeric"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="payment-notes">{copy.form.notes}</Label>
              <Textarea
                id="payment-notes"
                name="notes"
                placeholder={copy.form.notesPlaceholder}
                className="min-h-24"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-violet-600 focus:ring-violet-500"
              />
              <span>{copy.form.saveCard}</span>
            </label>

            <div className="text-xs text-muted-foreground">
              {copy.form.secureHint}
            </div>
          </div>

          <CardFooter className="flex flex-col gap-3 p-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {copy.form.billingHint}
            </div>
            <Button
              type="submit"
              variant="accent"
              size="lg"
              className="min-w-44"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : copy.payNow}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </CardFooter>
        </form>
      </div>
    </Card>
  );
}
