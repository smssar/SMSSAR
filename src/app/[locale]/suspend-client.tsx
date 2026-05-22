"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Clock3,
  Home,
  LogOut,
  MessageSquareWarning,
  Search,
  ShieldAlert,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Locale } from "@/lib/locales";
import type { UserRestriction } from "@/lib/user-restriction";

const copy = {
  en: {
    badge: "Account restricted",
    suspendedTitle: "Your account is temporarily suspended",
    blockedTitle: "Your account has been blocked",
    suspendedDescription:
      "You can't use the platform right now, but everything is waiting for you as soon as the suspension ends.",
    blockedDescription:
      "Your account is currently blocked and requires admin review before you can use the platform again.",
    messageLabel: "Admin message",
    statusLabel: "Status",
    untilLabel: "Suspended until",
    untilPending: "No end date set",
    activeRouteHint:
      "Please review the details below. If you believe this is an error, contact the team that manages your account.",
    primaryCta: "Go back home",
    secondaryCta: "Browse properties",
    highlights: [
      "Saved data stays safe while the restriction is active.",
      "Temporary suspensions lift automatically when the end time passes.",
      "Blocked accounts remain unavailable until an admin restores access.",
    ],
    helpTitle: "What happens next",
    helpBody:
      "If the message includes a suspension end time, you can return automatically after that moment. If your account is blocked, only an admin can restore it.",
    logout: "Logout",
  },
  ar: {
    badge: "الحساب مقيد",
    suspendedTitle: "تم إيقاف حسابك مؤقتًا",
    blockedTitle: "تم حظر حسابك",
    suspendedDescription:
      "لا يمكنك استخدام المنصة الآن، لكن كل شيء سيبقى جاهزًا لك عند انتهاء مدة الإيقاف.",
    blockedDescription:
      "حسابك محظور حاليًا ويحتاج إلى مراجعة من الإدارة قبل أن تتمكن من استخدام المنصة مرة أخرى.",
    messageLabel: "رسالة الإدارة",
    statusLabel: "الحالة",
    untilLabel: "موقوف حتى",
    untilPending: "لم يتم تحديد وقت نهاية",
    activeRouteHint:
      "راجع التفاصيل أدناه. إذا كنت تعتقد أن هناك خطأ، تواصل مع الفريق المسؤول عن حسابك.",
    primaryCta: "العودة إلى الرئيسية",
    secondaryCta: "تصفح العقارات",
    highlights: [
      "تبقى بياناتك محفوظة أثناء تفعيل التقييد.",
      "الإيقاف المؤقت ينتهي تلقائيًا عند وصول الوقت المحدد.",
      "الحسابات المحظورة تبقى غير متاحة حتى يعيد المدير تفعيلها.",
    ],
    helpTitle: "ما الذي يحدث بعد ذلك؟",
    helpBody:
      "إذا كانت الرسالة تتضمن وقت انتهاء للإيقاف، فستتمكن من العودة تلقائيًا بعده. وإذا كان الحساب محظورًا، فلا يمكن إعادته إلا من قبل الإدارة.",
    logout: "تسجيل الخروج",
  },
  fr: {
    badge: "Compte restreint",
    suspendedTitle: "Votre compte est temporairement suspendu",
    blockedTitle: "Votre compte a été bloqué",
    suspendedDescription:
      "Vous ne pouvez pas utiliser la plateforme pour le moment, mais tout sera disponible dès la fin de la suspension.",
    blockedDescription:
      "Votre compte est actuellement bloqué et nécessite une révision par un administrateur avant de pouvoir réutiliser la plateforme.",
    messageLabel: "Message de l'équipe",
    statusLabel: "Statut",
    untilLabel: "Suspendu jusqu'au",
    untilPending: "Aucune date de fin définie",
    activeRouteHint:
      "Veuillez consulter les détails ci-dessous. Si vous pensez qu'il s'agit d'une erreur, contactez l'équipe qui gère votre compte.",
    primaryCta: "Retour à l'accueil",
    secondaryCta: "Parcourir les biens",
    highlights: [
      "Les données enregistrées restent en sécurité pendant la restriction.",
      "Les suspensions temporaires se lèvent automatiquement à l'heure définie.",
      "Les comptes bloqués restent indisponibles jusqu'à ce qu'un administrateur les restaure.",
    ],
    helpTitle: "Ce qui se passe ensuite",
    helpBody:
      "Si le message inclut une date de fin de suspension, vous pourrez revenir automatiquement après celle-ci. Si votre compte est bloqué, seul un administrateur peut le réactiver.",
    logout: "Déconnexion",
  },
} as const;

function formatDateTime(value: Date | string | null, locale: Locale): string {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString(
    locale === "ar" ? "ar" : locale === "fr" ? "fr" : "en",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

export function SuspendPageClient({
  locale,
  restriction,
  suspendedUntil,
}: {
  locale: Locale;
  restriction: UserRestriction;
  suspendedUntil: Date | string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const pageCopy = copy[locale];
  const isBlocked = restriction.type === "BANNED";
  const title = isBlocked ? pageCopy.blockedTitle : pageCopy.suspendedTitle;
  const description = isBlocked
    ? pageCopy.blockedDescription
    : pageCopy.suspendedDescription;
  const message =
    restriction.message ||
    (isBlocked
      ? locale === "ar"
        ? "تم تقييد الحساب مؤقتًا من قبل الإدارة."
        : locale === "fr"
          ? "Le compte a été bloqué par un administrateur."
          : "This account has been restricted by an administrator."
      : locale === "ar"
        ? "تم إيقاف الحساب مؤقتًا من قبل الإدارة."
        : locale === "fr"
          ? "Le compte a été suspendu temporairement par un administrateur."
          : "This account is temporarily suspended by an administrator.");

  const untilText = isBlocked
    ? pageCopy.untilPending
    : suspendedUntil
      ? formatDateTime(suspendedUntil, locale)
      : pageCopy.untilPending;

  const handleLogoutAndNavigate = (href: string) => {
    startTransition(async () => {
      await signOut({ redirect: false });
      router.push(href);
    });
  };

  const handleLogout = () => {
    startTransition(async () => {
      await signOut({ redirect: false });
      router.push("/");
    });
  };

  return (
    <main className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_30%),linear-gradient(to_bottom,rgba(248,250,252,0.5),transparent)] dark:bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_30%),linear-gradient(to_bottom,rgba(15,23,42,0.35),transparent)]" />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section className="space-y-6">
            <Badge variant="accent" className="px-4 py-2 text-sm">
              <ShieldAlert className="h-4 w-4" />
              {pageCopy.badge}
            </Badge>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                {description}
              </p>
            </div>

            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              {pageCopy.activeRouteHint}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                onClick={() => handleLogoutAndNavigate(`/${locale}`)}
                disabled={isPending}
                variant="accent"
                size="lg"
              >
                <Home className="h-4 w-4" />
                {pageCopy.primaryCta}
              </Button>
              <Button
                onClick={() => handleLogoutAndNavigate(`/${locale}/properties`)}
                disabled={isPending}
                variant="outline"
                size="lg"
              >
                <Search className="h-4 w-4" />
                {pageCopy.secondaryCta}
              </Button>
            </div>

            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              {pageCopy.highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-border/60 bg-background/80 p-4 text-sm leading-6 text-muted-foreground shadow-sm backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="lg:justify-self-end">
            <Card className="overflow-hidden border-border/70 bg-card/90 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
              <div className="border-b border-border/60 bg-linear-to-r from-violet-500/10 via-fuchsia-500/8 to-sky-500/10 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                    {isBlocked ? (
                      <MessageSquareWarning className="h-6 w-6" />
                    ) : (
                      <Clock3 className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {pageCopy.statusLabel}
                    </div>
                    <div className="text-xl font-semibold tracking-tight">
                      {isBlocked
                        ? locale === "ar"
                          ? "محظور"
                          : locale === "fr"
                            ? "Bloqué"
                            : "Blocked"
                        : locale === "ar"
                          ? "موقوف مؤقتًا"
                          : locale === "fr"
                            ? "Suspendu"
                            : "Suspended"}
                    </div>
                  </div>
                </div>
              </div>

              <CardContent className="space-y-5 p-6">
                <div className="rounded-3xl border border-border/60 bg-muted/20 p-4">
                  <div className="text-sm font-medium text-foreground">
                    {pageCopy.messageLabel}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {message}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-border/60 bg-background p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {pageCopy.statusLabel}
                    </div>
                    <div className="mt-2 text-sm font-medium text-foreground">
                      {isBlocked
                        ? locale === "ar"
                          ? "حظر إداري"
                          : locale === "fr"
                            ? "Blocage administratif"
                            : "Administrative block"
                        : locale === "ar"
                          ? "إيقاف مؤقت"
                          : locale === "fr"
                            ? "Suspension temporaire"
                            : "Temporary suspension"}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-border/60 bg-background p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {pageCopy.untilLabel}
                    </div>
                    <div className="mt-2 text-sm font-medium text-foreground">
                      {untilText}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="text-sm font-medium text-foreground">
                    {pageCopy.helpTitle}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {pageCopy.helpBody}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  <Button
                    onClick={() => handleLogoutAndNavigate(`/${locale}`)}
                    disabled={isPending}
                    variant="outline"
                    size="md"
                  >
                    {pageCopy.primaryCta}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Button>
                  <Button
                    onClick={() =>
                      handleLogoutAndNavigate(`/${locale}/properties`)
                    }
                    disabled={isPending}
                    size="md"
                  >
                    <Search className="h-4 w-4" />
                    {pageCopy.secondaryCta}
                  </Button>
                  <Button
                    onClick={handleLogout}
                    disabled={isPending}
                    variant="secondary"
                    size="md"
                  >
                    <LogOut className="h-4 w-4" />
                    {pageCopy.logout}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}
