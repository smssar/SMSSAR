"use client";

import type { Locale } from "@/lib/locales";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useSearchParams, useParams } from "next/navigation";
import Link from "next/link";

const translations = {
  ar: {
    error: "خطأ",
    paymentFailed: "فشل الدفع",
    tryAgain: "حاول مرة أخرى",
    support: "الاتصال بالدعم",
  },
  fr: {
    error: "Erreur",
    paymentFailed: "Échec du paiement",
    tryAgain: "Réessayer",
    support: "Contacter le support",
  },
  en: {
    error: "Error",
    paymentFailed: "Payment Failed",
    tryAgain: "Try Again",
    support: "Contact Support",
  },
};

export default function WhatsappPaymentErrorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params.locale as Locale) || "en";
  const t = translations[locale];
  const phone = searchParams.get("phone") || "";
  const packageType = searchParams.get("package");
  const error = searchParams.get("error") || "unknown";

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-destructive/5 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Error Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-destructive/20 blur-xl" />
            <AlertCircle className="relative h-20 w-20 text-destructive" />
          </div>
        </div>

        {/* Error Card */}
        <Card className="border-destructive/20 bg-card/50 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-destructive">
              {t.error}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3 text-center">
              <h1 className="text-2xl font-bold">{t.paymentFailed}</h1>
              <p className="text-muted-foreground">
                {error === "cancelled"
                  ? locale === "ar"
                    ? "تم إلغاء عملية الدفع"
                    : locale === "fr"
                      ? "Le paiement a été annulé"
                      : "Payment was cancelled"
                  : locale === "ar"
                    ? "حدث خطأ أثناء معالجة الدفع"
                    : locale === "fr"
                      ? "Une erreur s'est produite lors du traitement du paiement"
                      : "An error occurred while processing your payment"}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/${locale}/whatsapp-token-payment${phone ? `?phone=${encodeURIComponent(phone)}` : ""}${packageType ? `${phone ? "&" : "?"}package=${encodeURIComponent(packageType)}` : ""}`}
                className="flex-1"
              >
                <Button size="lg" className="w-full">
                  {t.tryAgain}
                </Button>
              </Link>
              <Link href={`/${locale}/contact`} className="flex-1">
                <Button variant="outline" size="lg" className="w-full">
                  {t.support}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
