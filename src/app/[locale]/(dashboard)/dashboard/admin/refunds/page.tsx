import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefundButton } from "./refund-button";
import {
  Undo2,
  DollarSign,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { SubscriptionStatus } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import Link from "next/link";
import { RefundFilters } from "./refund-filters";

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const VALID_STATUSES = [
  "ACTIVE",
  "CANCELLED",
  "EXPIRED",
  "PENDING",
  "WiLL_EXPIRE",
  "SCHEDULED",
  "DISABLED",
] as const;

const REFUND_ACTION_STATUSES: SubscriptionStatus[] = [
  "ACTIVE",
  "SCHEDULED",
  "WiLL_EXPIRE",
];

function isValidStatus(value: string): value is SubscriptionStatus {
  return VALID_STATUSES.includes(value as (typeof VALID_STATUSES)[number]);
}

const fmt = (d?: Date | null) =>
  d
    ? new Date(d).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const PAGE_SIZE = 10;

export default async function AdminRefundsPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const messages = getMessages(locale);

  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);
  if (session.user.role !== "ADMIN") redirect(`/${locale}/dashboard`);

  // Extract filter parameters
  const email = typeof sp.email === "string" ? sp.email : "";
  const paymentId = typeof sp.paymentId === "string" ? sp.paymentId : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const dateFrom = typeof sp.dateFrom === "string" ? sp.dateFrom : "";
  const dateTo = typeof sp.dateTo === "string" ? sp.dateTo : "";
  const page = Math.max(
    1,
    parseInt(typeof sp.page === "string" ? sp.page : "1"),
  );

  // Build where clause
  const where: Prisma.SubscriptionWhereInput = { paymentId: { not: null } };

  if (email) {
    where.user = { email: { contains: email, mode: "insensitive" } };
  }
  if (paymentId) {
    where.paymentId = { contains: paymentId, mode: "insensitive" };
  }
  if (status && isValidStatus(status)) {
    where.status = status;
  }
  if (dateFrom) {
    where.createdAt = { gte: new Date(dateFrom) };
  }
  if (dateTo) {
    if (
      where.createdAt &&
      typeof where.createdAt === "object" &&
      "gte" in where.createdAt
    ) {
      (where.createdAt as Prisma.DateTimeFilter).lte = new Date(dateTo);
    } else {
      where.createdAt = { lte: new Date(dateTo) };
    }
  }

  // Get total count and paginated results
  const [totalCount, subscriptions] = await Promise.all([
    prisma.subscription.count({ where }),
    prisma.subscription.findMany({
      where,
      include: { user: true, plan: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
              <Undo2 className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {messages.dashboard.admin.refundsPage?.title ?? "Refunds"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {messages.dashboard.admin.refundsPage?.intro ??
                  "List of recent paid subscriptions. Refund payments when necessary."}
              </p>
            </div>
          </div>
          <div className="rounded-lg border bg-card/50 p-4">
            <div className="text-2xl font-bold">{totalCount}</div>
            <div className="text-xs text-muted-foreground">
              {locale === "ar"
                ? "دفعات مدفوعة"
                : locale === "fr"
                  ? "Paiements payés"
                  : "Paid subscriptions"}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <RefundFilters locale={locale} />

      {/* Subscriptions List */}
      <div className="space-y-3">
        {subscriptions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Undo2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-center text-muted-foreground font-medium">
                {locale === "ar"
                  ? "لا توجد اشتراكات مدفوعة"
                  : locale === "fr"
                    ? "Aucun abonnement payant"
                    : "No paid subscriptions"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {subscriptions.map((sub) => (
              <Card
                key={sub.id}
                className="border-border/70 hover:border-border transition-colors hover:shadow-sm"
              >
                <CardContent className="p-6">
                  <div className="grid gap-6 md:grid-cols-[1fr_auto]">
                    {/* Left: Details */}
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold truncate">
                              {sub.plan?.title ?? sub.planId}
                            </h3>
                            <Badge variant="secondary" className="shrink-0">
                              {sub.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {sub.user?.email}
                          </p>
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div className="grid gap-3 text-sm">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            <span>
                              {messages.dashboard.admin.refundsPage?.payment ??
                                "Payment"}
                            </span>
                          </div>
                          <code className="text-xs font-mono font-medium bg-background px-2 py-1 rounded border">
                            {sub.paymentId}
                          </code>
                        </div>

                        <div className="grid gap-3 grid-cols-1">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>
                                {messages.dashboard.admin.refundsPage
                                  ?.started ?? "Started"}
                              </span>
                            </div>
                            <span className="font-medium text-xs">
                              {fmt(sub.startDate)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>
                                {locale === "ar"
                                  ? "ينتهي"
                                  : locale === "fr"
                                    ? "Se termine"
                                    : "Ends"}
                              </span>
                            </div>
                            <span className="font-medium text-xs">
                              {fmt(sub.endDate)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>
                                {messages.dashboard.admin.refundsPage
                                  ?.created ?? "Created"}
                              </span>
                            </div>
                            <span className="font-medium text-xs">
                              {fmt(sub.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Action Button */}
                    <div className="flex items-center justify-center md:items-end md:justify-end">
                      {REFUND_ACTION_STATUSES.includes(sub.status) ? (
                        <RefundButton
                          paymentId={sub.paymentId!}
                          subscriptionId={sub.id}
                          cancelText={messages.common.cancel ?? "Cancel"}
                          partialAmountLabel={
                            messages.dashboard.admin.refundsPage
                              ?.partialAmount ?? "Partial amount (DH)"
                          }
                          partialAmountHelp={
                            messages.dashboard.admin.refundsPage
                              ?.partialAmountHelp ??
                            "Leave empty for a full refund"
                          }
                          partialAmountPlaceholder={
                            messages.dashboard.admin.refundsPage
                              ?.partialAmountPlaceholder ?? "0 DH"
                          }
                          confirmText={
                            messages.dashboard.admin.refundsPage
                              ?.refundConfirm ??
                            "Refund this payment? This will mark the subscription as cancelled."
                          }
                          successText={
                            messages.dashboard.admin.refundsPage
                              ?.refundSuccess ?? "Refund issued"
                          }
                          errorText={
                            messages.dashboard.admin.refundsPage?.refundError ??
                            "Refund failed"
                          }
                          processingText={
                            messages.dashboard.admin.refundsPage?.processing ??
                            "Processing..."
                          }
                          refundText={
                            messages.dashboard.admin.refundsPage?.refund ??
                            "Refund"
                          }
                        />
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                        >
                          {locale === "ar"
                            ? "الاسترجاع غير متاح لهذه الحالة"
                            : locale === "fr"
                              ? "Remboursement indisponible pour ce statut"
                              : "Refund unavailable for this status"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            <div className="flex items-center justify-between gap-2 mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {locale === "ar"
                  ? `الصفحة ${page} من ${totalPages} (${totalCount} إجمالي)`
                  : locale === "fr"
                    ? `Page ${page} sur ${totalPages} (${totalCount} total)`
                    : `Page ${page} of ${totalPages} (${totalCount} total)`}
              </div>
              <div className="flex gap-2">
                {hasPrevPage ? (
                  <Link
                    href={`?page=${page - 1}${email ? `&email=${encodeURIComponent(email)}` : ""}${paymentId ? `&paymentId=${encodeURIComponent(paymentId)}` : ""}${status ? `&status=${encodeURIComponent(status)}` : ""}${dateFrom ? `&dateFrom=${encodeURIComponent(dateFrom)}` : ""}${dateTo ? `&dateTo=${encodeURIComponent(dateTo)}` : ""}`}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {locale === "ar"
                        ? "السابق"
                        : locale === "fr"
                          ? "Précédent"
                          : "Previous"}
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {locale === "ar"
                      ? "السابق"
                      : locale === "fr"
                        ? "Précédent"
                        : "Previous"}
                  </Button>
                )}
                {hasNextPage ? (
                  <Link
                    href={`?page=${page + 1}${email ? `&email=${encodeURIComponent(email)}` : ""}${paymentId ? `&paymentId=${encodeURIComponent(paymentId)}` : ""}${status ? `&status=${encodeURIComponent(status)}` : ""}${dateFrom ? `&dateFrom=${encodeURIComponent(dateFrom)}` : ""}${dateTo ? `&dateTo=${encodeURIComponent(dateTo)}` : ""}`}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      {locale === "ar"
                        ? "التالي"
                        : locale === "fr"
                          ? "Suivant"
                          : "Next"}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="flex items-center gap-1"
                  >
                    {locale === "ar"
                      ? "التالي"
                      : locale === "fr"
                        ? "Suivant"
                        : "Next"}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
