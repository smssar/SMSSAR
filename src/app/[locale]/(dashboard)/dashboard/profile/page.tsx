import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/locales";
import { UserProfilePanel } from "@/components/shared/user-profile-panel";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  if (session.user.role !== "USER") {
    if (session.user.role === "SELLER" || session.user.role === "SMSSAR") {
      redirect(`/${locale}/dashboard/seller`);
    }
    if (session.user.role === "ADMIN") {
      redirect(`/${locale}/dashboard/admin`);
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      passwordHash: true,
    },
  });

  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-br from-violet-600/15 via-background to-fuchsia-600/10 p-6 sm:p-8">
        <div className="pointer-events-none absolute -top-8 -right-8 h-36 w-36 rounded-full bg-fuchsia-500/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-violet-500/15 blur-2xl" />

        <div className="relative">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {locale === "ar" ? "الملف الشخصي" : "Profile"}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {locale === "ar"
              ? "حدّث معلومات حسابك الشخصي هنا، وابقَ على تحكم كامل ببياناتك."
              : "Update your personal account information here and keep full control over your account details."}
          </p>
        </div>
      </div>

      <UserProfilePanel
        locale={locale}
        initialUser={{
          id: user.id,
          name: user.name ?? "",
          email: user.email ?? "",
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          hasPassword: Boolean(user.passwordHash),
        }}
      />
    </div>
  );
}
