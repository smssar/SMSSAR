"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/locales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { BadgeCheck, Mail, Mic, Music2, Phone, Zap } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { normalizePhoneNumber } from "@/lib/phone";

type WhatsappTokenPaymentClientProps = {
  locale: Locale;
};

type PackageKind = "tokens" | "audio";

type PackageDetails = {
  size: number;
  price: number;
  type: "tokens" | "audio";
};

type PackageInfoResponse = {
  tokens: PackageDetails;
  audio: PackageDetails;
};

const translations = {
  ar: {
    title: "شراء باقة واتس آب",
    description: "اشتر باقات إضافية لمساعدك الذكي",
    email: "البريد الإلكتروني",
    emailPlaceholder: "أدخل بريدك الإلكتروني",
    phone: "رقم الهاتف",
    phonePlaceholder: "أدخل رقم هاتفك (مثال: 212612345678)",
    tokenPackage: "حزمة الرموز",
    audioPackage: "حزمة الصوت",
    packageType: "نوع الحزمة",
    price: "السعر",
    tokens: "الرموز",
    voiceNotes: "الملاحظات الصوتية",
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
    selectTokens: "حدد العدد",
    min: "الحد الأدنى",
    max: "الحد الأقصى",
    packageLabel: "الحزمة المختارة",
  },
  fr: {
    title: "Acheter une formule WhatsApp",
    description: "Achetez des formules supplémentaires pour votre assistant",
    email: "Email",
    emailPlaceholder: "Entrez votre email",
    phone: "Numéro de téléphone",
    phonePlaceholder: "Entrez votre numéro (ex: 212612345678)",
    tokenPackage: "Forfait de jetons",
    audioPackage: "Forfait audio",
    packageType: "Type de forfait",
    price: "Prix",
    tokens: "Jetons",
    voiceNotes: "Notes vocales",
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
    selectTokens: "Sélectionnez la quantité",
    min: "Minimum",
    max: "Maximum",
    packageLabel: "Forfait sélectionné",
  },
  en: {
    title: "Buy a WhatsApp Package",
    description: "Purchase additional packages for your AI assistant",
    email: "Email",
    emailPlaceholder: "Enter your email",
    phone: "Phone Number",
    phonePlaceholder: "Enter your phone number (e.g., 212612345678)",
    tokenPackage: "Token Package",
    audioPackage: "Audio Package",
    packageType: "Package Type",
    price: "Price",
    tokens: "Tokens",
    voiceNotes: "Voice Notes",
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
    selectTokens: "Select quantity",
    min: "Minimum",
    max: "Maximum",
    packageLabel: "Selected package",
  },
};

export function WhatsappTokenPaymentClient({
  locale,
}: WhatsappTokenPaymentClientProps) {
  const t = translations[locale] || translations.en;
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(searchParams.get("phone") || "");
  const [loading, setLoading] = useState(false);
  const [packageInfo, setPackageInfo] = useState<PackageInfoResponse | null>(
    null,
  );
  const [selectedPackage, setSelectedPackage] = useState<PackageKind>(
    searchParams.get("package") === "audio" ? "audio" : "tokens",
  );
  const [selectedQuantity, setSelectedQuantity] = useState(8000);
  const [userChangedQuantity, setUserChangedQuantity] = useState(false);

  const effectiveQuantity = useMemo(() => {
    if (!packageInfo) return selectedQuantity;
    const defaultQty =
      selectedPackage === "audio"
        ? packageInfo.audio.size
        : packageInfo.tokens.size;
    return userChangedQuantity ? selectedQuantity : defaultQty;
  }, [packageInfo, selectedPackage, userChangedQuantity, selectedQuantity]);

  const activePackage = useMemo(() => {
    if (!packageInfo) return null;
    return selectedPackage === "audio" ? packageInfo.audio : packageInfo.tokens;
  }, [packageInfo, selectedPackage]);

  useEffect(() => {
    const fetchPackageInfo = async () => {
      try {
        const response = await fetch("/api/whatsapp/token-package-info");
        if (response.ok) {
          const data = (await response.json()) as PackageInfoResponse;
          setPackageInfo(data);
        }
      } catch (error) {
        console.error("Failed to fetch package info:", error);
      }
      if (!phone) return;
      try {
        const response = await fetch(
          "/api/whatsapp/get-whatsapp-user-contact?phone=" +
            encodeURIComponent(phone),
        );
        if (response.ok) {
          const data = await response.json();
          if (data.email) setEmail(data.email);
          if (data.phone) setPhone(data.phone);
        }
      } catch (error) {
        console.error("Failed to fetch user contact info:", error);
      }
    };

    fetchPackageInfo();
  }, []);

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const currentPackage = activePackage;
      const proportionalPrice = currentPackage
        ? Math.round(
            (effectiveQuantity / currentPackage.size) * currentPackage.price,
          )
        : 500;

      const updateResponse = await fetch("/api/whatsapp/update-user-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone, email, locale }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update contact information");
      }

      const checkoutResponse = await fetch(
        "/api/payments/whatsapp/dodo-checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: normalizedPhone,
            email,
            locale,
            packageType: selectedPackage,
            quantity: effectiveQuantity,
            tokens: effectiveQuantity,
            amount: proportionalPrice,
          }),
        },
      );

      if (!checkoutResponse.ok) {
        const error = await checkoutResponse.json().catch(() => ({}));
        throw new Error(error.error || "Checkout failed");
      }

      const result = await checkoutResponse.json();
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      throw new Error("No checkout URL returned");
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(
        error instanceof Error ? error.message : "Payment processing failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedQuantityLabel =
    selectedPackage === "audio" ? t.voiceNotes : t.tokens;

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-secondary/10 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
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
          <div className="lg:col-span-2">
            <Card className="border-border/70 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>
                  {locale === "ar"
                    ? "معلوماتك"
                    : locale === "fr"
                      ? "Vos informations"
                      : "Your Information"}
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

                  {packageInfo && (
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <BadgeCheck className="h-4 w-4" />
                        {t.packageType}
                      </label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => {
                            setUserChangedQuantity(false);
                            setSelectedPackage("tokens");
                          }}
                          className={`rounded-3xl border p-4 text-left transition cursor-pointer hover:scale-105 ${
                            selectedPackage === "tokens"
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border/70 bg-background hover:bg-muted/20"
                          }`}
                        >
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <Zap className="h-4 w-4 text-primary" />
                            {t.tokenPackage}
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {packageInfo.tokens.size.toLocaleString()}{" "}
                            {t.tokens} ·{" "}
                            {packageInfo.tokens.price.toLocaleString()}{" "}
                            {locale === "ar"
                              ? "درهم"
                              : locale === "fr"
                                ? "DH"
                                : "DH"}
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setUserChangedQuantity(false);
                            setSelectedPackage("audio");
                          }}
                          className={`rounded-3xl border p-4 text-left transition cursor-pointer hover:scale-105 ${
                            selectedPackage === "audio"
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border/70 bg-background hover:bg-muted/20"
                          }`}
                        >
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <Music2 className="h-4 w-4 text-primary" />
                            {t.audioPackage}
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {packageInfo.audio.size.toLocaleString()}{" "}
                            {t.voiceNotes} ·{" "}
                            {packageInfo.audio.price.toLocaleString()}{" "}
                            {locale === "ar"
                              ? "درهم"
                              : locale === "fr"
                                ? "DH"
                                : "DH"}
                          </p>
                        </button>
                      </div>
                    </div>
                  )}

                  {activePackage && (
                    <div className="space-y-4">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        {selectedPackage === "audio" ? (
                          <Mic className="h-4 w-4" />
                        ) : (
                          <Zap className="h-4 w-4" />
                        )}
                        {t.selectTokens}
                      </label>
                      <div className="space-y-3">
                        <input
                          type="range"
                          min={Math.max(
                            1,
                            Math.round(
                              activePackage.size *
                                (activePackage.type === "audio" ? 0.5 : 0.1),
                            ),
                          )}
                          max={Math.max(
                            activePackage.size,
                            Math.round(
                              activePackage.size *
                                (activePackage.type === "audio" ? 10 : 3),
                            ),
                          )}
                          step={Math.max(
                            1,
                            Math.round(activePackage.size * 0.1),
                          )}
                          value={effectiveQuantity}
                          onChange={(e) => {
                            setSelectedQuantity(parseInt(e.target.value, 10));
                            setUserChangedQuantity(true);
                          }}
                          disabled={loading}
                          className="w-full cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            {t.min}:{" "}
                            {Math.max(
                              1,
                              Math.round(activePackage.size * 0.1),
                            ).toLocaleString()}
                          </span>
                          <span>
                            {t.max}:{" "}
                            {Math.max(
                              activePackage.size,
                              Math.round(activePackage.size * 5),
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div className="rounded-lg bg-primary/5 p-3 text-center">
                          <p className="text-2xl font-bold text-primary">
                            {effectiveQuantity.toLocaleString()}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {selectedQuantityLabel}
                          </p>
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

          <div>
            <Card className="sticky top-4 border-primary/20 bg-linear-to-br from-primary/5 to-primary/10 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">{t.summary}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border border-primary/20 bg-background/50 p-4">
                  <p className="mb-2 text-sm text-muted-foreground">
                    {selectedPackage === "audio"
                      ? t.audioPackage
                      : t.tokenPackage}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-bold">
                      {effectiveQuantity.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {selectedQuantityLabel}
                    </span>
                  </div>
                  <div className="mt-4 border-t border-border/50 pt-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.price}:</span>
                      <span className="font-semibold">
                        {activePackage
                          ? Math.round(
                              (effectiveQuantity / activePackage.size) *
                                activePackage.price,
                            )
                          : 500}{" "}
                        {locale === "ar"
                          ? "درهم"
                          : locale === "fr"
                            ? "DH"
                            : "DH"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold">{t.features}</p>
                  <ul className="space-y-2">
                    {[t.instant, t.support].map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg bg-muted/50 p-3 text-xs">
                  <p>
                    {selectedPackage === "audio"
                      ? locale === "ar"
                        ? "سيتم إضافة باقة الصوت إلى حسابك مباشرة بعد إتمام الدفع"
                        : locale === "fr"
                          ? "Le forfait audio sera ajouté instantanément après le paiement"
                          : "The audio package will be added instantly after payment"
                      : locale === "ar"
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
