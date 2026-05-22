/* eslint-disable @typescript-eslint/no-explicit-any */
import { AdminPlansPanel } from "@/components/admin/admin-plans-panel";
import { prisma } from "@/lib/prisma";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";

type AdminPlansCopy = {
  intro: string;
};

export default async function AdminPlansPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const messages = getMessages(locale);
  const admin = (messages as any).dashboard?.admin as
    | (typeof messages.dashboard.admin & {
        managementPage: { plans: AdminPlansCopy };
      })
    | undefined;
  const pageCopy = admin?.managementPage?.plans ?? { intro: "" };
  const plans = await prisma.plan.findMany({
    orderBy: { price: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {messages.dashboard.admin.plans}
        </h1>
        <p className="mt-2 text-muted-foreground">{pageCopy.intro}</p>
      </div>
      <AdminPlansPanel locale={locale} initialPlans={plans} />
    </div>
  );
}
