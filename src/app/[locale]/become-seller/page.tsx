import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ensureFreePlan } from "@/lib/ensure-free-plan";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/locales";

export default async function BecomeSellerPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/register?role=seller`);
  }

  if (session.user.role === "ADMIN") {
    redirect(`/${locale}/dashboard/admin`);
  }

  if (session.user.role === "SELLER") {
    redirect(`/${locale}/dashboard/seller`);
  }

  await ensureFreePlan();

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      role: "SELLER",
      planId: session.user.planId ?? "plan_free",
    },
  });

  redirect(`/${locale}/dashboard/seller`);
}
