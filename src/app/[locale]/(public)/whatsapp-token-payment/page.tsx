import type { Metadata } from "next";
import type { Locale } from "@/lib/locales";
import { WhatsappTokenPaymentClient } from "@/components/payment/whatsapp-token-payment-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title:
      locale === "ar"
        ? "شراء باقة واتس آب"
        : locale === "fr"
          ? "Acheter une formule WhatsApp"
          : "Buy a WhatsApp Package",
    description:
      locale === "ar"
        ? "شراء باقات إضافية لمساعدك الذكي على واتس آب"
        : locale === "fr"
          ? "Acheter des formules supplémentaires pour votre assistant WhatsApp"
          : "Purchase additional WhatsApp packages for your AI assistant",
  };
}

export default async function WhatsappTokenPaymentPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  return <WhatsappTokenPaymentClient locale={locale} />;
}
