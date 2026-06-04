import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMessages } from "@/lib/messages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import type { Locale } from "@/lib/locales";

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams?: Promise<{
    page?: string | string[];
    pageSize?: string | string[];
  }>;
};

const formatDate = (d?: Date | null) =>
  d
    ? new Date(d).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "-";

export default async function SellerSubscriptionsPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const messages = getMessages(locale);

  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);

  if (session.user.role !== "SELLER") {
    redirect(`/${locale}/dashboard/profile`);
  }

  const pageStr = Array.isArray(resolvedSearchParams?.page)
    ? resolvedSearchParams.page[0]
    : resolvedSearchParams?.page;
  const pageSizeStr = Array.isArray(resolvedSearchParams?.pageSize)
    ? resolvedSearchParams.pageSize[0]
    : resolvedSearchParams?.pageSize;

  const page = Math.max(1, Number(pageStr ?? 1));
  const pageSize = Math.max(5, Math.min(50, Number(pageSizeStr ?? 10)));
  const skip = (page - 1) * pageSize;

  const [total, subscriptions] = await Promise.all([
    prisma.subscription.count({ where: { userId: session.user.id } }),
    prisma.subscription.findMany({
      where: { userId: session.user.id },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {messages.dashboard.seller.subscriptions || "Subscriptions"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {messages.dashboard.seller.subscriptionsIntro}
        </p>
      </div>

      <div className="grid gap-4">
        {subscriptions.map((sub) => (
          <Card key={sub.id} className="border-border/70">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-lg">
                  {sub.plan?.title ?? sub.planId}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={`${sub.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {sub.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">
                  {messages.common.start}
                </div>
                <div className="font-medium">{formatDate(sub.startDate)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">
                  {messages.common.end}
                </div>
                <div className="font-medium">{formatDate(sub.endDate)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">
                  {messages.common.payment}
                </div>
                <div className="font-medium">{sub.paymentId ?? "-"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">
                  {messages.common.created}
                </div>
                <div className="font-medium">{formatDate(sub.createdAt)}</div>
              </div>
              <div className="md:col-span-4">
                <div className="text-muted-foreground">
                  {messages.dashboard.seller.localSession}
                </div>
                <div className="break-all font-medium">
                  {sub.localSessionId ?? "-"}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-muted-foreground">
            {messages.common.page} {page} / {totalPages}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ButtonLink
            href={`/${locale}/dashboard/seller/subscriptions?page=${Math.max(1, page - 1)}&pageSize=${pageSize}`}
            variant="outline"
            size="sm"
            className="disabled:opacity-50"
          >
            {messages.common.previous}
          </ButtonLink>

          <ButtonLink
            href={`/${locale}/dashboard/seller/subscriptions?page=${Math.min(totalPages, page + 1)}&pageSize=${pageSize}`}
            variant="default"
            size="sm"
          >
            {messages.common.next}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
