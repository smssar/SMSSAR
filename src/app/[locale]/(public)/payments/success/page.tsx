import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/lib/locales";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default async function PaymentSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;

  const possibleKeys = [
    "session",
    "session_id",
    "sessionId",
    "checkout_id",
    "checkoutId",
    "id",
  ];

  let sessionId: string | null = null;
  for (const k of possibleKeys) {
    const v = resolvedSearchParams[k];
    if (typeof v === "string" && v.length > 0) {
      sessionId = v;
      break;
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_30%)]" />

      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-20 w-20 text-emerald-500" />
          <h1 className="mt-6 text-4xl font-semibold">
            {locale === "ar"
              ? "تم الدفع بنجاح"
              : locale === "fr"
                ? "Paiement réussi"
                : "Payment successful"}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            {locale === "ar"
              ? "شكراً لك! تم تنشيط خطتك الجديدة."
              : locale === "fr"
                ? "Merci ! Votre nouveau forfait est maintenant actif."
                : "Thank you! Your new plan is now active."}
          </p>
        </div>

        <Card className="w-full border-border/70">
          <CardContent className="space-y-6 p-8">
            <div className="border-b border-border/60 pb-6">
              <p className="text-sm text-muted-foreground">
                {locale === "ar"
                  ? "رقم جلسة الدفع"
                  : locale === "fr"
                    ? "ID de session"
                    : "Session ID"}
              </p>
              <p className="mt-2 font-mono text-sm">{sessionId || "—"}</p>
            </div>

            <div className="space-y-3 rounded-2xl border border-border/60 bg-background/50 p-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                {locale === "ar"
                  ? "تم تفعيل الخطة الجديدة"
                  : locale === "fr"
                    ? "Nouveau forfait activé"
                    : "New plan activated"}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                {locale === "ar"
                  ? "حسابك محدث"
                  : locale === "fr"
                    ? "Votre compte a été mis à jour"
                    : "Your account updated"}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                {locale === "ar"
                  ? "يمكنك البدء في إنشاء إعلانات الآن"
                  : locale === "fr"
                    ? "Vous pouvez maintenant commencer à créer des annonces"
                    : "Ready to create listings"}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink
                href={`/${locale}/dashboard/seller`}
                variant="accent"
                size="lg"
                className="flex-1"
              >
                {locale === "ar"
                  ? "اذهب إلى لوحة التحكم"
                  : locale === "fr"
                    ? "Aller au tableau de bord"
                    : "Go to dashboard"}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </ButtonLink>
              <ButtonLink
                href={`/${locale}/properties`}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                {locale === "ar"
                  ? "تصفح العقارات"
                  : locale === "fr"
                    ? "Parcourir les biens"
                    : "Browse properties"}
              </ButtonLink>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              {locale === "ar"
                ? "إذا كان لديك أي أسئلة، يرجى التواصل بنا"
                : locale === "fr"
                  ? "Si vous avez des questions, n'hésitez pas à nous contacter"
                  : "If you have any questions, please contact us"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
