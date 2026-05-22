import type { Metadata } from "next";
import type { Locale } from "@/lib/locales";
import { getMessages } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { PaymentForm } from "../../../../components/payment/payment-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = getMessages(locale);

  return {
    title: messages.payment.title,
    description: messages.payment.description,
  };
}

export default async function PaymentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const messages = getMessages(locale);
  const session = await auth();

  const selectedPlanId =
    typeof resolvedSearchParams.plan === "string"
      ? resolvedSearchParams.plan
      : null;

  const selectedPlan = selectedPlanId
    ? await prisma.plan.findUnique({ where: { id: selectedPlanId } })
    : null;

  const fallbackPlan = await prisma.plan.findFirst({
    orderBy: { price: "asc" },
  });

  const paymentPlan = selectedPlan ?? fallbackPlan;

  const amount = paymentPlan
    ? paymentPlan.price === 0
      ? locale === "ar"
        ? "مجاني"
        : locale === "fr"
          ? "Gratuit"
          : "Free"
      : locale === "ar"
        ? `${paymentPlan.price} د.إ`
        : locale === "fr"
          ? `${paymentPlan.price} €`
          : `$${paymentPlan.price}`
    : "—";

  const planName = paymentPlan
    ? locale === "ar"
      ? paymentPlan.title_ar || paymentPlan.title
      : locale === "fr"
        ? paymentPlan.title_fr || paymentPlan.title
        : paymentPlan.title
    : locale === "ar"
      ? "خطة غير محددة"
      : locale === "fr"
        ? "Forfait non défini"
        : "Unselected plan";

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_30%),linear-gradient(to_bottom,rgba(248,250,252,0.72),transparent)] dark:bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_30%),linear-gradient(to_bottom,rgba(15,23,42,0.52),transparent)]" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section className="space-y-4 text-center">
          <div className="inline-flex items-center justify-center rounded-full border border-border/60 bg-background/80 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur">
            {messages.payment.eyebrow}
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {messages.payment.title}
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            {messages.payment.description}
          </p>
        </section>

        {!session?.user ? (
          <div className="rounded-2xl border border-border/70 bg-card/80 p-8 text-center">
            <p className="text-muted-foreground">
              {locale === "ar"
                ? "يرجى تسجيل الدخول لإتمام الدفع"
                : locale === "fr"
                  ? "Veuillez vous connecter pour terminer le paiement"
                  : "Please sign in to complete checkout"}
            </p>
          </div>
        ) : (
          <PaymentForm
            copy={messages.payment}
            planId={paymentPlan?.id || ""}
            amount={amount}
            planName={planName}
          />
        )}
      </div>
    </div>
  );
}
