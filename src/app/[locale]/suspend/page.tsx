import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserRestriction } from "@/lib/user-restriction";
import type { Locale } from "@/lib/locales";
import { SuspendPageClient } from "../suspend-client";

export default async function SuspendPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session || !session.user?.id) {
    redirect(`/${locale}/login`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      status: true,
      suspendedUntil: true,
      suspendedMessage: true,
      bannedMessage: true,
    },
  });

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const restriction = getUserRestriction(user);
  if (!restriction) {
    redirect(`/${locale}/dashboard`);
  }

  return <SuspendPageClient locale={locale} restriction={restriction} suspendedUntil={user.suspendedUntil} />;
}
