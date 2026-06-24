import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminWhatsappPanel } from "@/components/admin/admin-whatsapp-panel";
import type { WhatsappTexts } from "@/components/admin/admin-whatsapp-panel";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";
import type { Prisma } from "@/generated/prisma/client";

function toPositiveInteger(
  value: string | null | undefined,
  defaultValue: number,
) {
  if (!value) return defaultValue;
  const num = parseInt(value, 10);
  return num > 0 ? num : defaultValue;
}

export default async function AdminWhatsappPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const resolvedSearchParams = await searchParams;

  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);
  if (session.user.role !== "ADMIN") {
    return (
      <div className="rounded-3xl border border-border/70 bg-card p-8 text-sm text-muted-foreground">
        {locale == "en"
          ? "You do not have permission to access this page."
          : locale == "fr"
            ? "Vous n'avez pas la permission d'accéder à cette page."
            : "You do not have permission to access this page."}
      </div>
    );
  }

  const PAGE_SIZE = Math.min(
    100,
    Math.max(
      5,
      parseInt((resolvedSearchParams.pageSize as string) || "10", 10),
    ),
  );
  const currentPage = toPositiveInteger(resolvedSearchParams.page as string, 1);
  const search = (resolvedSearchParams.search as string) ?? "";

  const where: Prisma.WhatsappUserWhereInput =
    {} as Prisma.WhatsappUserWhereInput;
  if (search.trim()) {
    where.OR = [
      { phoneNumber: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  const [totalCount, users] = await Promise.all([
    prisma.whatsappUser.count({ where }),
    prisma.whatsappUser.findMany({
      where,
      select: {
        id: true,
        phoneNumber: true,
        name: true,
        language: true,
        lastInteractionAt: true,
        _count: { select: { messages: true } },
      },
      orderBy: { lastInteractionAt: "desc" },
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const initialUsers = users.map((u) => ({
    id: u.id,
    phoneNumber: u.phoneNumber,
    name: u.name,
    language: u.language,
    totalMessages: u._count?.messages ?? 0,
    lastInteractionAt: u.lastInteractionAt?.toISOString() ?? null,
  }));

  const messages = getMessages(locale);

  function getNested<T>(obj: unknown, path: string[]): T | undefined {
    let cur: unknown = obj;
    for (const p of path) {
      if (
        cur &&
        typeof cur === "object" &&
        p in (cur as Record<string, unknown>)
      ) {
        cur = (cur as Record<string, unknown>)[p];
      } else {
        return undefined;
      }
    }
    return cur as T | undefined;
  }

  const whatsappTexts =
    getNested<Record<string, unknown>>(messages, [
      "dashboard",
      "admin",
      "managementPage",
      "whatsapp",
    ]) ??
    getNested<Record<string, unknown>>(messages, [
      "dashboard",
      "admin",
      "whatsapp",
    ]) ??
    {};

  const textsRec = whatsappTexts as Record<string, unknown>;

  const textsTyped: WhatsappTexts = {
    title: typeof textsRec.title === "string" ? textsRec.title : undefined,
    intro: typeof textsRec.intro === "string" ? textsRec.intro : undefined,
    searchPlaceholder:
      typeof textsRec.searchPlaceholder === "string"
        ? textsRec.searchPlaceholder
        : undefined,
    usersTable: (() => {
      const ut =
        typeof textsRec.usersTable === "object" && textsRec.usersTable
          ? (textsRec.usersTable as Record<string, unknown>)
          : undefined;
      if (!ut) return undefined;
      return {
        phone: typeof ut.phone === "string" ? ut.phone : undefined,
        name: typeof ut.name === "string" ? ut.name : undefined,
        lang: typeof ut.lang === "string" ? ut.lang : undefined,
        messages: typeof ut.messages === "string" ? ut.messages : undefined,
        lastInteraction:
          typeof ut.lastInteraction === "string"
            ? ut.lastInteraction
            : undefined,
        actions: typeof ut.actions === "string" ? ut.actions : undefined,
        view: typeof ut.view === "string" ? ut.view : undefined,
        noMessages:
          typeof ut.noMessages === "string" ? ut.noMessages : undefined,
      };
    })(),

    pageInfo:
      typeof textsRec.pageInfo === "string" ? textsRec.pageInfo : undefined,
    pagination: (() => {
      const p =
        typeof textsRec.pagination === "object" && textsRec.pagination
          ? (textsRec.pagination as Record<string, unknown>)
          : undefined;
      if (!p) return undefined;
      return {
        prev: typeof p.prev === "string" ? p.prev : undefined,
        next: typeof p.next === "string" ? p.next : undefined,
      };
    })(),
    messageSearchPlaceholder:
      typeof textsRec.messageSearchPlaceholder === "string"
        ? textsRec.messageSearchPlaceholder
        : undefined,
    roleLabels: (() => {
      const r =
        typeof textsRec.roleLabels === "object" && textsRec.roleLabels
          ? (textsRec.roleLabels as Record<string, unknown>)
          : undefined;
      if (!r) return undefined;
      return {
        user: typeof r.user === "string" ? r.user : undefined,
        assistant: typeof r.assistant === "string" ? r.assistant : undefined,
        system: typeof r.system === "string" ? r.system : undefined,
      };
    })(),
  };

  const titleText = textsTyped.title ?? "Whatsapp";
  const introText =
    textsTyped.intro ?? "Inspect Whatsapp users and message history.";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{titleText}</h1>
        <p className="mt-2 text-muted-foreground">{introText}</p>
      </div>

      <AdminWhatsappPanel
        locale={locale}
        initialUsers={initialUsers}
        currentPage={currentPage}
        totalPages={totalPages}
        texts={textsTyped}
      />
    </div>
  );
}
