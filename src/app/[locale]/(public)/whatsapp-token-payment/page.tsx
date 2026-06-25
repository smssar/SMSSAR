import type { Metadata } from "next";
import type { Locale } from "@/lib/locales";
import { getMessages } from "@/lib/messages";
import { WhatsappTokenPaymentClient } from "@/components/payment/whatsapp-token-payment-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = getMessages(locale);

  return {
    title:
      locale === "ar"
        ? "شراء رموز الواتس آب"
        : locale === "fr"
          ? "Acheter des jetons WhatsApp"
          : "Buy WhatsApp Tokens",
    description:
      locale === "ar"
        ? "شراء رموز إضافية لمساعدك الذكي على واتس آب"
        : locale === "fr"
          ? "Acheter des jetons supplémentaires pour votre assistant WhatsApp"
          : "Purchase additional tokens for your WhatsApp AI assistant",
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
