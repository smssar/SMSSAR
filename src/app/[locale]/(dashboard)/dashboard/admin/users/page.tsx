import { getMessages } from "@/lib/messages";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminUsersPanel } from "@/components/admin/admin-users-panel";
import type { Locale } from "@/lib/locales";
import type { Prisma } from "@/generated/prisma/client";

function toPositiveInteger(
  value: string | null | undefined,
  defaultValue: number,
): number {
  if (!value) return defaultValue;
  const num = parseInt(value, 10);
  return num > 0 ? num : defaultValue;
}

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const resolvedSearchParams = await searchParams;
  const session = await auth();
  const messages = getMessages(locale);
  type AdminUsersCopy = { intro: string; adminOnly: string };

  const admin = (messages.dashboard?.admin ??
    {}) as typeof messages.dashboard.admin & {
    managementPage?: { users?: AdminUsersCopy };
  };
  const pageCopy: AdminUsersCopy = admin.managementPage?.users ?? {
    intro:
      locale === "ar"
        ? "أنشئ وأدر المستخدمين."
        : locale === "fr"
          ? "Create and manage users."
          : "Create and manage users.",
    adminOnly:
      locale === "ar"
        ? "هذه الصفحة متاحة للمديرين فقط."
        : locale === "fr"
          ? "This page is available to admins only."
          : "This page is available to admins only.",
  };

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  if (session.user.role !== "ADMIN") {
    return (
      <div className="rounded-3xl border border-border/70 bg-card p-8 text-sm text-muted-foreground">
        {pageCopy.adminOnly}
      </div>
    );
  }

  function getValidPageSize(value: string | null | undefined): number {
    const parsed = parseInt(value || "", 10);
    if (Number.isFinite(parsed) && parsed >= 5 && parsed <= 100) {
      return parsed;
    }
    return 10; // default
  }

  const PAGE_SIZE = getValidPageSize(resolvedSearchParams.pageSize as string);
  const currentPage = toPositiveInteger(resolvedSearchParams.page as string, 1);
  const search = (resolvedSearchParams.search as string) ?? "";
  const roleParam = (resolvedSearchParams.role as string) ?? "";
  const statusParam = (resolvedSearchParams.status as string) ?? "";
  const validRoles = ["USER", "SELLER", "ADMIN"] as const;
  const validStatuses = ["ACTIVE", "PENDING", "SUSPENDED", "BANNED"] as const;

  const isValidRole = (value: string): value is (typeof validRoles)[number] =>
    validRoles.includes(value as (typeof validRoles)[number]);

  const isValidStatus = (
    value: string,
  ): value is (typeof validStatuses)[number] =>
    validStatuses.includes(value as (typeof validStatuses)[number]);

  const plans = await prisma.plan.findMany({ orderBy: { price: "asc" } });

  const q = search.trim().toLowerCase();

  const whereConditions: Prisma.UserWhereInput[] = [];

  if (q) {
    whereConditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    });
  }

  if (roleParam && isValidRole(roleParam)) {
    whereConditions.push({ role: roleParam });
  }

  if (statusParam && isValidStatus(statusParam)) {
    whereConditions.push({ status: statusParam });
  }

  const where: Prisma.UserWhereInput =
    whereConditions.length > 0 ? { AND: whereConditions } : {};

  const [totalCount, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        phone: true,
        bio: true,
        isVerified: true,
        role: true,
        status: true,
        suspendedAt: true,
        suspendedUntil: true,
        suspendedMessage: true,
        suspendedBy: true,
        bannedMessage: true,
        planId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {messages.dashboard.admin.users}
        </h1>
        <p className="mt-2 text-muted-foreground">{pageCopy.intro}</p>
      </div>

      <AdminUsersPanel
        locale={locale}
        initialUsers={users}
        plans={plans}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
}
