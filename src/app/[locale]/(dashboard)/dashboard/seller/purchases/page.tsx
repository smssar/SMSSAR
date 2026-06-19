import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";
import { redirect } from "next/navigation";
import { PurchaseCheckoutClient } from "@/components/payment/purchase-checkout-client";

export const dynamic = "force-dynamic";

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
        ? "شراء الإضافات"
        : locale === "fr"
          ? "Acheter des options"
          : "Purchase Add-ons",
    description: messages.payment.description,
  };
}

export default async function SellerPurchasesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (
    !session?.user?.id ||
    (session.user.role !== "SELLER" && session.user.role !== "SMSSAR")
  ) {
    redirect(`/${locale}/login`);
  }

  const products = await prisma.purchaseProduct.findMany({
    where: {
      active: true,
      code: {
        in: [
          "EXTRA_LISTINGS",
          "EXTRA_IMAGES",
          "EXTRA_VIDEOS",
          "EXTRA_FEATURED_LISTINGS",
        ],
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {locale === "ar"
            ? "شراء الإضافات"
            : locale === "fr"
              ? "Acheter des options"
              : "Purchase Add-ons"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {locale === "ar"
            ? "اختر الإضافة المناسبة لاحتياجاتك ثم أكمل الدفع الآمن."
            : locale === "fr"
              ? "Choisissez l'option qui vous convient puis finalisez le paiement sécurisé."
              : "Choose the add-on you need, then complete secure checkout."}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-border/70 bg-card/80 p-8 text-center text-muted-foreground">
          {locale === "ar"
            ? "لا توجد إضافات متاحة حالياً"
            : locale === "fr"
              ? "Aucune option n'est disponible pour le moment"
              : "No add-ons are available right now"}
        </div>
      ) : null}

      <PurchaseCheckoutClient locale={locale} products={products} />
    </div>
  );
}
