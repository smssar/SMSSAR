"use client";

import { useState, useEffect } from "react";
import type { Locale } from "@/lib/locales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Zap, Mail, Phone } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { normalizePhoneNumber } from "@/lib/phone";

type WhatsappTokenPaymentClientProps = {
  locale: Locale;
};

const translations = {
  ar: {
    title: "شراء رموز الواتس آب",
    description: "اشتر رموز إضافية لمساعدك الذكي",
    email: "البريد الإلكتروني",
    emailPlaceholder: "أدخل بريدك الإلكتروني",
    phone: "رقم الهاتف",
    phonePlaceholder: "أدخل رقم هاتفك (مثال: 212612345678)",
    tokenPackage: "حزمة الرموز",
    price: "السعر",
    tokens: "الرموز",
    buyNow: "اشتر الآن",
    required: "هذا الحقل مطلوب",
    invalidEmail: "البريد الإلكتروني غير صحيح",
    invalidPhone: "رقم الهاتف غير صحيح",
    processing: "جاري المعالجة...",
    summary: "ملخص الطلب",
    tokenValue: "قيمة الرموز",
    features: "المميزات",
    instant: "تفعيل فوري",
    support: "دعم كامل",
    unlimited: "استخدام غير محدود",
    selectTokens: "حدد عدد الرموز",
    min: "الحد الأدنى",
    max: "الحد الأقصى",
  },
  fr: {
    title: "Acheter des jetons WhatsApp",
    description: "Achetez des jetons supplémentaires pour votre assistant",
    email: "Email",
    emailPlaceholder: "Entrez votre email",
    phone: "Numéro de téléphone",
    phonePlaceholder: "Entrez votre numéro (ex: 212612345678)",
    tokenPackage: "Forfait de jetons",
    price: "Prix",
    tokens: "Jetons",
    buyNow: "Acheter maintenant",
    required: "Ce champ est obligatoire",
    invalidEmail: "Email invalide",
    invalidPhone: "Numéro invalide",
    processing: "Traitement...",
    summary: "Résumé de la commande",
    tokenValue: "Valeur des jetons",
    features: "Caractéristiques",
    instant: "Activation instantanée",
    support: "Support complet",
    unlimited: "Utilisation illimitée",
    selectTokens: "Sélectionnez le nombre de jetons",
    min: "Minimum",
    max: "Maximum",
  },
  en: {
    title: "Buy WhatsApp Tokens",
    description: "Purchase additional tokens for your AI assistant",
    email: "Email",
    emailPlaceholder: "Enter your email",
    phone: "Phone Number",
    phonePlaceholder: "Enter your phone number (e.g., 212612345678)",
    tokenPackage: "Token Package",
    price: "Price",
    tokens: "Tokens",
    buyNow: "Buy Now",
    required: "This field is required",
    invalidEmail: "Invalid email",
    invalidPhone: "Invalid phone number",
    processing: "Processing...",
    summary: "Order Summary",
    tokenValue: "Token Value",
    features: "Features",
    instant: "Instant Activation",
    support: "Full Support",
    unlimited: "Unlimited Usage",
    selectTokens: "Select number of tokens",
    min: "Minimum",
    max: "Maximum",
  },
};

export function WhatsappTokenPaymentClient({ locale }: WhatsappTokenPaymentClientProps) {
  const t = translations[locale] || translations.en;
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(searchParams.get("phone") || "");
  const [loading, setLoading] = useState(false);
  const [tokenData, setTokenData] = useState<{
    size: number;
    price: number;
  } | null>(null);
  const [selectedTokens, setSelectedTokens] = useState(10000);

  useEffect(() => {
    // Fetch token package data
    const fetchTokenData = async () => {
      try {
        const response = await fetch("/api/whatsapp/token-package-info");
        if (response.ok) {
          const data = await response.json();
          setTokenData(data);
          setSelectedTokens(data.size);
        }
      } catch (error) {
        console.error("Failed to fetch token data:", error);
      }
    };

    fetchTokenData();
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!email.trim()) {
      toast.error(t.required);
      return;
    }
    if (!validateEmail(email)) {
      toast.error(t.invalidEmail);
      return;
    }
    if (!phone.trim()) {
      toast.error(t.required);
      return;
    }
    let normalizedPhone: string;
    try {
      normalizedPhone = normalizePhoneNumber(phone);
    } catch {
      toast.error(t.invalidPhone);
      return;
    }

    setLoading(true);

    try {
      // Calculate proportional price based on selected tokens
      const proportionalPrice = tokenData ? Math.round((selectedTokens / tokenData.size) * tokenData.price) : 500;

      // First, update/create WhatsApp user with email
      const updateResponse = await fetch("/api/whatsapp/update-user-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone, email, locale }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update contact information");
      }

      // Then proceed to checkout with custom token amount and price
      const checkoutResponse = await fetch("/api/payments/whatsapp/dodo-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone, email, locale, tokens: selectedTokens, amount: proportionalPrice }),
      });

      if (!checkoutResponse.ok) {
        const error = await checkoutResponse.json();
        throw new Error(error.error || "Checkout failed");
      }

      const result = await checkoutResponse.json();

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(
        error instanceof Error ? error.message : "Payment processing failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-secondary/10 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-lg text-muted-foreground">{t.description}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="border-border/70 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>
                  {locale === "ar" ? "معلوماتك" : locale === "fr" ? "Vos informations" : "Your Information"}
                </CardTitle>
                <CardDescription>
                  {locale === "ar"
                    ? "أدخل بريدك الإلكتروني ورقم هاتفك"
                    : locale === "fr"
                      ? "Entrez votre email et numéro de téléphone"
                      : "Enter your email and phone number"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Mail className="h-4 w-4" />
                      {t.email} <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder={t.emailPlaceholder}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="bg-background/50"
                    />
                  </div>

                  {/* Phone Field */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Phone className="h-4 w-4" />
                      {t.phone} <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="tel"
                      placeholder={t.phonePlaceholder}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={loading}
                      className="bg-background/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      {locale === "ar"
                        ? "استخدم الصيغة: 212612345678"
                        : locale === "fr"
                          ? "Format: 212612345678"
                          : "Format: 212612345678"}
                    </p>
                  </div>

                  {/* Token Range Selector */}
                  {tokenData && (
                    <div className="space-y-4">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <Zap className="h-4 w-4" />
                        {t.selectTokens}
                      </label>
                      <div className="space-y-3">
                        <input
                          type="range"
                          min={Math.max(1000, Math.round(tokenData.size * 0.1))}
                          max={Math.round(tokenData.size * 5)}
                          step={Math.round(tokenData.size * 0.1)}
                          value={selectedTokens}
                          onChange={(e) => setSelectedTokens(parseInt(e.target.value))}
                          disabled={loading}
                          className="w-full cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{t.min}: {Math.max(1000, Math.round(tokenData.size * 0.1)).toLocaleString()}</span>
                          <span>{t.max}: {Math.round(tokenData.size * 5).toLocaleString()}</span>
                        </div>
                        <div className="rounded-lg bg-primary/5 p-3 text-center">
                          <p className="text-2xl font-bold text-primary">
                            {selectedTokens.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{t.tokens}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    size="lg"
                    className="w-full"
                  >
                    {loading ? t.processing : t.buyNow}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div>
            <Card className="sticky top-4 border-primary/20 bg-linear-to-br from-primary/5 to-primary/10 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">{t.summary}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price Box */}
                <div className="rounded-lg border border-primary/20 bg-background/50 p-4">
                  <p className="mb-2 text-sm text-muted-foreground">{t.tokenPackage}</p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-bold">
                      {selectedTokens.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">{t.tokens}</span>
                  </div>
                  <div className="mt-4 border-t border-border/50 pt-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.price}:</span>
                      <span className="font-semibold">
                        {tokenData
                          ? Math.round((selectedTokens / tokenData.size) * tokenData.price / 10)
                          : Math.round(500 / 10)}{" "}
                        DH
                      </span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <p className="mb-3 text-sm font-semibold">{t.features}</p>
                  <ul className="space-y-2">
                    {[t.instant, t.support, t.unlimited].map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Info Box */}
                <div className="rounded-lg bg-muted/50 p-3 text-xs">
                  <p>
                    {locale === "ar"
                      ? "سيتم إضافة الرموز مباشرة إلى حسابك بعد إتمام الدفع"
                      : locale === "fr"
                        ? "Les jetons seront ajoutés instantanément après le paiement"
                        : "Tokens will be added instantly after payment"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
