import type { Locale } from "@/lib/locales";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, MessageCircle } from "lucide-react";
import Link from "next/link";

const translations = {
  ar: {
    success: "تم بنجاح!",
    title: "تم شراء الباقة بنجاح",
    description:
      "تمت إضافة الباقة إلى حسابك. يمكنك الآن الاستمرار في استخدام مساعدك الذكي.",
    units: "الوحدات المضافة",
    continue: "العودة إلى واتس آب",
    support: "الدعم",
  },
  fr: {
    success: "Succès!",
    title: "Achat de formule WhatsApp réussi",
    description:
      "La formule a été ajoutée à votre compte. Vous pouvez maintenant continuer à utiliser votre assistant.",
    units: "Unités ajoutées",
    continue: "Revenir à WhatsApp",
    support: "Support",
  },
  en: {
    success: "Success!",
    title: "WhatsApp Package Purchase Successful",
    description:
      "The package has been added to your account. You can now continue using your AI assistant.",
    units: "Units Added",
    continue: "Return to WhatsApp",
    support: "Support",
  },
};

export default async function WhatsappTokenPaymentSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const orderId =
    typeof resolvedSearchParams.orderId === "string"
      ? resolvedSearchParams.orderId
      : null;
  const packageType =
    resolvedSearchParams.package === "audio" ? "audio" : "tokens";

  const t = translations[locale] || translations.en;

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-green-500/5 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-green-500/20 blur-xl" />
            <CheckCircle className="relative h-20 w-20 text-green-500" />
          </div>
        </div>

        <Card className="border-green-500/20 bg-card/50 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">{t.success}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-3 text-center">
              <h1 className="text-2xl font-bold">{t.title}</h1>
              <p className="text-muted-foreground">{t.description}</p>
              {orderId && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {locale === "ar"
                    ? "معرّف الطلب"
                    : locale === "fr"
                      ? "ID de commande"
                      : "Order ID"}
                  : <span className="font-mono">{orderId}</span>
                </p>
              )}
            </div>

            <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
              <p className="text-center text-sm font-medium">
                {packageType === "audio"
                  ? locale === "ar"
                    ? "✓ تم إضافة باقة الصوت إلى حسابك"
                    : locale === "fr"
                      ? "✓ Le forfait audio a été ajouté à votre compte"
                      : "✓ The audio package has been added to your account"
                  : locale === "ar"
                    ? "✓ تم إضافة الرموز مباشرة إلى حسابك"
                    : locale === "fr"
                      ? "✓ Les jetons ont été ajoutés à votre compte"
                      : "✓ Tokens have been added to your account"}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={`/${locale}/whatsapp`} className="flex-1">
                <Button size="lg" className="w-full">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  {t.continue}
                </Button>
              </Link>
              <Link href={`/${locale}/contact`} className="flex-1">
                <Button variant="outline" size="lg" className="w-full">
                  {t.support}
                </Button>
              </Link>
            </div>

            <div className="space-y-2 rounded-lg bg-muted/50 p-4">
              <p className="text-sm font-medium">
                {locale === "ar"
                  ? "🎯 ماذا يمكنك أن تفعل الآن:"
                  : locale === "fr"
                    ? "🎯 Ce que vous pouvez faire maintenant:"
                    : "🎯 What you can now do:"}
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  {packageType === "audio"
                    ? locale === "ar"
                      ? "✓ استخدام الملاحظات الصوتية بسهولة"
                      : locale === "fr"
                        ? "✓ Utiliser les notes vocales facilement"
                        : "✓ Use voice notes more easily"
                    : locale === "ar"
                      ? "✓ استخدام مساعدك الذكي بدون قيود"
                      : locale === "fr"
                        ? "✓ Utiliser votre assistant sans limite"
                        : "✓ Use your AI assistant without limits"}
                </li>
                <li>
                  {locale === "ar"
                    ? "✓ البحث عن العقارات بسهولة"
                    : locale === "fr"
                      ? "✓ Rechercher des propriétés facilement"
                      : "✓ Search for properties easily"}
                </li>
                <li>
                  {locale === "ar"
                    ? "✓ الحصول على توصيات مخصصة"
                    : locale === "fr"
                      ? "✓ Obtenir des recommandations personnalisées"
                      : "✓ Get personalized recommendations"}
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
