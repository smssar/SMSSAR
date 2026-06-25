"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeftRight,
  BadgeInfo,
  Clock3,
  Loader2,
  MessageSquare,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/locales";

type WhatsappUserRow = {
  id: string;
  phoneNumber: string;
  name?: string | null;
  language?: string | null;
  totalMessages: number;
  tokenUsage?: number | null;
  tokensLimit?: number | null;
  lastInteractionAt?: string | null;
};

type WhatsappTexts = {
  title?: string;
  intro?: string;
  searchPlaceholder?: string;
  usersTable?: {
    phone?: string;
    name?: string;
    lang?: string;
    messages?: string;
    tokenUsage?: string;
    tokensLimit?: string;
    lastInteraction?: string;
    actions?: string;
    view?: string;
    noMessages?: string;
  };
  pageInfo?: string;
  pagination?: { prev?: string; next?: string };
  messageSearchPlaceholder?: string;
  roleLabels?: { user?: string; assistant?: string; system?: string };
};

export type { WhatsappTexts };

type WhatsappMessageRow = {
  id: string;
  role: string;
  content: string;
  tokens?: number | null;
  createdAt: string;
};

type PendingDelete = {
  id: string;
  content: string;
  role: string;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat().format(value ?? 0);
}

function formatLimit(value?: number | null) {
  if (value === null || value === undefined) return "Unlimited";
  return new Intl.NumberFormat().format(value);
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-3xl border border-border/70 bg-gradient-to-br from-background to-muted/25 p-4 shadow-sm">
      <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 flex items-start justify-between gap-3">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <BadgeInfo className="mt-1 h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 text-xs leading-5 text-muted-foreground">{hint}</div>
    </div>
  );
}

export function AdminWhatsappPanel({
  locale,
  initialUsers,
  currentPage,
  totalPages,
  texts,
}: {
  locale: Locale;
  initialUsers: WhatsappUserRow[];
  currentPage: number;
  totalPages: number;
  texts?: WhatsappTexts;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState(initialUsers);
  const [selectedUser, setSelectedUser] = useState<WhatsappUserRow | null>(
    null,
  );
  const [messages, setMessages] = useState<WhatsappMessageRow[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [msgPage, setMsgPage] = useState(1);
  const [msgTotalPages, setMsgTotalPages] = useState(1);
  const [msgPageSize] = useState(25);
  const [msgSearch, setMsgSearch] = useState("");
  const [tokensLimitDraft, setTokensLimitDraft] = useState("");
  const [savingLimit, setSavingLimit] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null,
  );

  const currentSearch = (searchParams.get("search") as string) ?? "";
  const currentPageSize = (searchParams.get("pageSize") as string) ?? "10";

  const selectedStats = useMemo(() => {
    if (!selectedUser) return [];

    return [
      {
        label:
          texts?.usersTable?.messages ??
          (locale === "ar"
            ? "الرسائل"
            : locale === "fr"
              ? "Messages"
              : "Messages"),
        value: formatNumber(selectedUser.totalMessages),
        hint:
          locale === "ar"
            ? "إجمالي الرسائل المحفوظة"
            : locale === "fr"
              ? "Messages stockés"
              : "Stored messages",
      },
      {
        label:
          texts?.usersTable?.tokenUsage ??
          (locale === "ar"
            ? "استهلاك الرموز"
            : locale === "fr"
              ? "Jetons consommés"
              : "Token usage"),
        value: formatNumber(selectedUser.tokenUsage ?? 0),
        hint:
          locale === "ar"
            ? "الاستهلاك التراكمي الحالي"
            : locale === "fr"
              ? "Consommation cumulée"
              : "Cumulative usage",
      },
      {
        label:
          texts?.usersTable?.tokensLimit ??
          (locale === "ar"
            ? "حد الرموز"
            : locale === "fr"
              ? "Limite de jetons"
              : "Token limit"),
        value: formatLimit(selectedUser.tokensLimit),
        hint:
          locale === "ar"
            ? "اتركه فارغًا ليصبح غير محدود"
            : locale === "fr"
              ? "Vide = illimité"
              : "Blank = unlimited",
      },
    ];
  }, [
    locale,
    selectedUser,
    texts?.usersTable?.messages,
    texts?.usersTable?.tokenUsage,
    texts?.usersTable?.tokensLimit,
  ]);

  function setPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    router.push(`?${params.toString()}`);
  }

  function setPageSize(size: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (size === "10") params.delete("pageSize");
    else params.set("pageSize", size);
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  function updateUser(updated: WhatsappUserRow) {
    setUsers((current) =>
      current.map((user) => (user.id === updated.id ? updated : user)),
    );
    setSelectedUser((current) =>
      current && current.id === updated.id ? updated : current,
    );
  }

  async function openUser(user: WhatsappUserRow) {
    setSelectedUser(user);
    setTokensLimitDraft(
      user.tokensLimit === null || user.tokensLimit === undefined
        ? ""
        : String(user.tokensLimit),
    );
    setMsgsLoading(true);
    setMsgPage(1);
    setPendingDelete(null);
    try {
      const response = await fetch(
        `/api/admin/whatsapp/${user.id}/messages?page=1&pageSize=${msgPageSize}`,
      );
      const payload = await response.json();
      setMessages(payload?.data ?? []);
      setMsgTotalPages(payload?.totalPages ?? 1);
    } catch (error) {
      console.error(error);
      setMessages([]);
    } finally {
      setMsgsLoading(false);
    }
  }

  async function loadMessages(nextPage: number) {
    if (!selectedUser) return;
    setMsgsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/whatsapp/${selectedUser.id}/messages?page=${nextPage}&pageSize=${msgPageSize}&search=${encodeURIComponent(msgSearch)}`,
      );
      const payload = await response.json();
      setMessages(payload?.data ?? []);
      setMsgPage(nextPage);
      setMsgTotalPages(payload?.totalPages ?? 1);
    } catch (error) {
      console.error(error);
    } finally {
      setMsgsLoading(false);
    }
  }

  async function saveTokensLimit() {
    if (!selectedUser) return;

    const draft = tokensLimitDraft.trim();
    const tokensLimit = draft === "" ? null : Number.parseInt(draft, 10);
    if (
      tokensLimit !== null &&
      (!Number.isInteger(tokensLimit) || tokensLimit < 0)
    ) {
      toast.error(
        locale === "ar"
          ? "أدخل رقمًا صحيحًا صالحًا أو اتركه فارغًا."
          : locale === "fr"
            ? "Entrez un nombre entier valide ou laissez vide."
            : "Enter a valid whole number or leave it blank.",
      );
      return;
    }

    setSavingLimit(true);
    try {
      const response = await fetch(`/api/admin/whatsapp/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokensLimit }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Status ${response.status}`);
      }

      const updated = payload?.data as WhatsappUserRow | undefined;
      if (updated) {
        updateUser(updated);
        setTokensLimitDraft(
          updated.tokensLimit === null || updated.tokensLimit === undefined
            ? ""
            : String(updated.tokensLimit),
        );
      }

      toast.success(
        locale === "ar"
          ? "تم تحديث حد الرموز."
          : locale === "fr"
            ? "Limite de jetons mise à jour."
            : "Token limit updated.",
      );
    } catch (error) {
      console.error("Failed to update token limit:", error);
      toast.error(
        locale === "ar"
          ? "فشل تحديث حد الرموز."
          : locale === "fr"
            ? "Échec de la mise à jour de la limite de jetons."
            : "Failed to update token limit.",
      );
    } finally {
      setSavingLimit(false);
    }
  }

  async function deleteMessage(messageId: string) {
    if (!selectedUser) return;

    setDeletingMessageId(messageId);
    try {
      const response = await fetch(
        `/api/admin/whatsapp/${selectedUser.id}/messages/${messageId}`,
        { method: "DELETE" },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Status ${response.status}`);
      }

      setMessages((current) =>
        current.filter((message) => message.id !== messageId),
      );
      const nextTotalMessages = payload?.data?.totalMessages;
      if (typeof nextTotalMessages === "number") {
        updateUser({ ...selectedUser, totalMessages: nextTotalMessages });
      }

      toast.success(
        locale === "ar"
          ? "تم حذف الرسالة."
          : locale === "fr"
            ? "Message supprimé."
            : "Message deleted.",
      );
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast.error(
        locale === "ar"
          ? "فشل حذف الرسالة."
          : locale === "fr"
            ? "Échec de la suppression du message."
            : "Failed to delete message.",
      );
    } finally {
      setDeletingMessageId(null);
      setPendingDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className=" border-border/70 bg-card/10 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur-sm">
        <CardHeader className="border-b border-border/60 pb-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                {locale === "ar"
                  ? "واتساب"
                  : locale === "fr"
                    ? "WhatsApp"
                    : "WhatsApp"}
              </div>
              <CardTitle className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {texts?.title ?? "Whatsapp users"}
              </CardTitle>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                {texts?.intro ??
                  "List WhatsApp users, inspect conversations, adjust token limits, and remove messages from the archive."}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={
                    texts?.searchPlaceholder ??
                    (locale === "ar"
                      ? "ابحث بالهاتف أو الاسم..."
                      : locale === "fr"
                        ? "Rechercher par téléphone ou nom..."
                        : "Search phone or name...")
                  }
                  value={currentSearch}
                  onChange={(e) => {
                    const params = new URLSearchParams(searchParams.toString());
                    if (e.target.value) params.set("search", e.target.value);
                    else params.delete("search");
                    params.delete("page");
                    router.push(`?${params.toString()}`);
                  }}
                  className="min-w-[280px] rounded-2xl border-border/70 pl-9"
                />
              </div>
              <select
                value={currentPageSize}
                onChange={(e) => setPageSize(e.target.value)}
                className="rounded-2xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          <div className="overflow-hidden rounded-3xl border border-border/60">
            <table className="min-w-full w-full text-left text-sm">
              <thead className="bg-muted/35 text-muted-foreground">
                <tr className="border-b border-border/70">
                  <th className="px-4 py-3 font-medium">
                    {texts?.usersTable?.phone ?? "Phone"}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {texts?.usersTable?.name ?? "Name"}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {texts?.usersTable?.lang ?? "Lang"}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {texts?.usersTable?.messages ?? "Messages"}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {texts?.usersTable?.tokenUsage ?? "Token usage"}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {texts?.usersTable?.tokensLimit ?? "Token limit"}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {texts?.usersTable?.lastInteraction ?? "Last interaction"}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {texts?.usersTable?.actions ?? "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="cursor-pointer bg-background/80 transition-colors hover:bg-muted/20"
                    onClick={() => openUser(user)}
                  >
                    <td className="px-4 py-4 font-medium text-foreground">
                      {user.phoneNumber}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {user.name || "-"}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="secondary" className="rounded-full">
                        {user.language || "-"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 font-semibold">
                      {formatNumber(user.totalMessages)}
                    </td>
                    <td className="px-4 py-4 font-semibold">
                      {formatNumber(user.tokenUsage)}
                    </td>
                    <td className="px-4 py-4 font-semibold">
                      {formatLimit(user.tokensLimit)}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {formatDate(user.lastInteractionAt)}
                    </td>
                    <td className="px-4 py-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(event) => {
                          event.stopPropagation();
                          openUser(user);
                        }}
                        className="rounded-full hover:bg-muted/60 cursor-pointer"
                      >
                        <ArrowLeftRight className="h-4 w-4" />
                        {texts?.usersTable?.view ?? "View"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <div>
              {texts?.pageInfo
                ? texts.pageInfo
                    .replace("{page}", String(currentPage))
                    .replace("{total}", String(totalPages))
                : `Page ${currentPage} of ${totalPages}`}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={totalPages <= 1 || currentPage <= 1}
                className="rounded-full"
              >
                {texts?.pagination?.prev ?? "Prev"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={totalPages <= 1 || currentPage >= totalPages}
                className="rounded-full"
              >
                {texts?.pagination?.next ?? "Next"}
              </Button>
            </div>
          </div>

          {selectedUser ? (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-[50] flex items-start justify-center px-4 pb-4  backdrop-blur-2xl backdrop-saturate-150"
              onClick={() => setSelectedUser(null)}
            >
              <div
                className="relative w-full max-w-7xl max-h-[calc(100vh-7rem)] overflow-hidden rounded-4xl border border-border/60 bg-card shadow-[0_30px_120px_-40px_rgba(15,23,42,0.8)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-violet-500 to-cyan-500" />

                <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="cursor-pointer rounded-full border border-border/60 bg-background p-2.5 text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div>
                      <div className="text-lg font-semibold tracking-tight">
                        {selectedUser.name || selectedUser.phoneNumber}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>{selectedUser.phoneNumber}</span>
                        <span>•</span>
                        <span>{selectedUser.language || "-"}</span>
                        <span>•</span>
                        <span>
                          {formatDate(selectedUser.lastInteractionAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                    Admin view
                  </Badge>
                </div>

                <div className="grid max-h-[calc(90vh-5rem)] gap-0 overflow-hidden lg:grid-cols-[360px_1fr]">
                  <div className="border-b border-border/60 bg-gradient-to-b from-muted/30 to-background p-6 lg:border-b-0 lg:border-r lg:border-border/60">
                    <div className="rounded-[1.75rem] border border-border/60 bg-background p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                            WhatsApp profile
                          </div>
                          <div className="mt-3 text-2xl font-semibold tracking-tight">
                            {selectedUser.name || selectedUser.phoneNumber}
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            {selectedUser.phoneNumber}
                          </div>
                        </div>
                        <Badge variant="secondary" className="rounded-full">
                          {selectedUser.language || "-"}
                        </Badge>
                      </div>

                      <div className="mt-6 grid gap-3">
                        {selectedStats.map((stat) => (
                          <StatCard
                            key={stat.label}
                            label={stat.label}
                            value={stat.value}
                            hint={stat.hint}
                          />
                        ))}
                      </div>

                      <div className="mt-6 rounded-[1.5rem] border border-border/60 bg-muted/20 p-4">
                        <Label className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                          {locale === "ar"
                            ? "تعديل حد الرموز"
                            : locale === "fr"
                              ? "Modifier la limite"
                              : "Edit token limit"}
                        </Label>
                        <div className="mt-3 flex gap-2">
                          <Input
                            type="number"
                            min="0"
                            placeholder={
                              locale === "ar"
                                ? "غير محدود"
                                : locale === "fr"
                                  ? "Illimité"
                                  : "Unlimited"
                            }
                            value={tokensLimitDraft}
                            onChange={(event) =>
                              setTokensLimitDraft(event.target.value)
                            }
                            className="rounded-2xl border-border/70"
                          />
                          <Button
                            onClick={saveTokensLimit}
                            disabled={savingLimit}
                            className="rounded-2xl"
                          >
                            {savingLimit ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MessageSquare className="h-4 w-4" />
                            )}
                            {locale === "ar"
                              ? "حفظ"
                              : locale === "fr"
                                ? "Enregistrer"
                                : "Save"}
                          </Button>
                        </div>
                        <p className="mt-3 text-xs leading-5 text-muted-foreground">
                          {locale === "ar"
                            ? "اترك الحقل فارغًا إذا أردت إلغاء الحد."
                            : locale === "fr"
                              ? "Laissez vide pour supprimer la limite."
                              : "Leave it blank to remove the limit."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 lg:overflow-y-auto">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                          Conversation history
                        </div>
                        <div className="mt-1 text-lg font-semibold tracking-tight">
                          {locale === "ar"
                            ? "الرسائل"
                            : locale === "fr"
                              ? "Messages"
                              : "Messages"}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder={
                              texts?.messageSearchPlaceholder ??
                              (locale === "ar"
                                ? "ابحث في الرسائل..."
                                : locale === "fr"
                                  ? "Rechercher dans les messages..."
                                  : "Search messages...")
                            }
                            value={msgSearch}
                            onChange={(event) =>
                              setMsgSearch(event.target.value)
                            }
                            className="min-w-[260px] rounded-2xl border-border/70 pl-9"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadMessages(1)}
                          className="rounded-2xl"
                        >
                          <Search className="h-4 w-4" />
                          {locale === "ar"
                            ? "بحث"
                            : locale === "fr"
                              ? "Rechercher"
                              : "Search"}
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-[1.75rem] border border-border/60 bg-background p-4 shadow-sm">
                      <div className="max-h-[58vh] space-y-3 overflow-auto pr-1">
                        {msgsLoading ? (
                          <div className="flex items-center justify-center py-16 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-border/60 px-6 py-16 text-center text-sm text-muted-foreground">
                            <MessageSquare className="mb-3 h-6 w-6" />
                            {texts?.usersTable?.noMessages ?? "No messages."}
                          </div>
                        ) : (
                          messages.map((message) => (
                            <div
                              key={message.id}
                              className="rounded-[1.35rem] border border-border/60 bg-gradient-to-br from-background to-muted/20 p-4 shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={
                                      message.role === "user"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className="rounded-full"
                                  >
                                    {texts?.roleLabels?.[
                                      message.role as
                                        | "user"
                                        | "assistant"
                                        | "system"
                                    ] ?? message.role}
                                  </Badge>
                                  {typeof message.tokens === "number" ? (
                                    <Badge
                                      variant="outline"
                                      className="rounded-full"
                                    >
                                      {message.tokens} tokens
                                    </Badge>
                                  ) : null}
                                </div>

                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock3 className="h-3.5 w-3.5" />
                                  {formatDate(message.createdAt)}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      setPendingDelete({
                                        id: message.id,
                                        content: message.content,
                                        role: message.role,
                                      })
                                    }
                                    className="rounded-full text-muted-foreground hover:bg-red-500/10 hover:text-red-600 cursor-pointer"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              <div className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-foreground/90">
                                {message.content}
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-4 text-sm text-muted-foreground">
                        <div>
                          {texts?.pageInfo
                            ? texts.pageInfo
                                .replace("{page}", String(msgPage))
                                .replace("{total}", String(msgTotalPages))
                            : `Page ${msgPage} of ${msgTotalPages}`}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              loadMessages(Math.max(1, msgPage - 1))
                            }
                            disabled={msgPage <= 1 || msgsLoading}
                            className="rounded-full"
                          >
                            {texts?.pagination?.prev ?? "Prev"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              loadMessages(Math.min(msgTotalPages, msgPage + 1))
                            }
                            disabled={msgPage >= msgTotalPages || msgsLoading}
                            className="rounded-full cursor-pointer"
                          >
                            {texts?.pagination?.next ?? "Next"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {pendingDelete ? (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="w-full max-w-xl rounded-[2rem] border border-border/60 bg-card p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      Confirm delete
                    </div>
                    <div className="mt-2 text-xl font-semibold tracking-tight">
                      {locale === "ar"
                        ? "هل تريد حذف هذه الرسالة؟"
                        : locale === "fr"
                          ? "Supprimer ce message ?"
                          : "Delete this message?"}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPendingDelete(null)}
                    className="rounded-full cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-4 rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full">
                      {pendingDelete.role}
                    </Badge>
                    <span>{pendingDelete.id}</span>
                  </div>
                  <div className="line-clamp-4 whitespace-pre-wrap break-words">
                    {pendingDelete.content}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setPendingDelete(null)}
                    className="rounded-full cursor-pointer"
                  >
                    {locale === "ar"
                      ? "إلغاء"
                      : locale === "fr"
                        ? "Annuler"
                        : "Cancel"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteMessage(pendingDelete.id)}
                    disabled={deletingMessageId === pendingDelete.id}
                    className="rounded-full cursor-pointer"
                  >
                    {deletingMessageId === pendingDelete.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    {locale === "ar"
                      ? "حذف"
                      : locale === "fr"
                        ? "Supprimer"
                        : "Delete"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminWhatsappPanel;
