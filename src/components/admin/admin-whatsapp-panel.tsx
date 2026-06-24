"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, MessageSquare, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Textarea not required currently

type WhatsappUserRow = {
  id: string;
  phoneNumber: string;
  name?: string | null;
  language?: string | null;
  totalMessages: number;
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

export function AdminWhatsappPanel({
  locale,
  initialUsers,
  currentPage,
  totalPages,
  texts,
}: {
  locale: "en" | "ar" | "fr";
  initialUsers: WhatsappUserRow[];
  currentPage: number;
  totalPages: number;
  texts?: WhatsappTexts;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // no top-level loading used here; message loading state is `msgsLoading`
  const [selectedUser, setSelectedUser] = useState<WhatsappUserRow | null>(
    null,
  );
  const [messages, setMessages] = useState<
    Array<{ id: string; role: string; content: string; createdAt: string }>
  >([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [msgPage, setMsgPage] = useState(1);
  const [msgTotalPages, setMsgTotalPages] = useState(1);
  const [msgPageSize] = useState(25);
  const [msgSearch, setMsgSearch] = useState("");

  const currentSearch = (searchParams.get("search") as string) ?? "";
  const currentPageSize = (searchParams.get("pageSize") as string) ?? "10";

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

  async function openUser(u: WhatsappUserRow) {
    setSelectedUser(u);
    setMsgsLoading(true);
    setMsgPage(1);
    try {
      const res = await fetch(
        `/api/admin/whatsapp/${u.id}/messages?page=1&pageSize=${msgPageSize}`,
      );
      const payload = await res.json();
      setMessages(payload?.data ?? []);
      setMsgTotalPages(payload?.totalPages ?? 1);
    } catch (err) {
      console.error(err);
      setMessages([]);
    } finally {
      setMsgsLoading(false);
    }
  }

  async function loadMoreMessages(nextPage: number) {
    if (!selectedUser) return;
    setMsgsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/whatsapp/${selectedUser.id}/messages?page=${nextPage}&pageSize=${msgPageSize}&search=${encodeURIComponent(msgSearch)}`,
      );
      const payload = await res.json();

      console.log("payload", payload);
      setMessages(payload?.data ?? []);
      setMsgPage(nextPage);
      setMsgTotalPages(payload?.totalPages ?? 1);
    } catch (err) {
      console.error(err);
    } finally {
      setMsgsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/70">
        <CardHeader className="flex flex-col gap-4 border-b border-border/60 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{texts?.title ?? "Whatsapp users"}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {texts?.intro ??
                  "List and inspect Whatsapp users and messages."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder={
                  texts?.searchPlaceholder ??
                  (locale === "ar"
                    ? "ابحث بالهاتف أو الاسم..."
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
                className="mr-2"
              />
              <select
                value={currentPageSize}
                onChange={(e) => setPageSize(e.target.value)}
                className="rounded-xl border border-border/70 bg-background px-3 py-2 text-sm"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          <div className="overflow-x-auto rounded-3xl border border-border/60">
            <table className="min-w-full w-full text-left text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
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
                    {texts?.usersTable?.lastInteraction ?? "Last interaction"}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {texts?.usersTable?.actions ?? "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {initialUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border/70 hover:bg-muted/10"
                  >
                    <td className="px-4 py-3">{u.phoneNumber}</td>
                    <td className="px-4 py-3">{u.name || "-"}</td>
                    <td className="px-4 py-3">{u.language || "-"}</td>
                    <td className="px-4 py-3">{u.totalMessages}</td>
                    <td className="px-4 py-3">
                      {u.lastInteractionAt
                        ? new Date(u.lastInteractionAt).toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openUser(u)}
                        className="cursor-pointer hover:bg-muted/20"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {texts?.usersTable?.view ?? "View"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
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
              >
                {texts?.pagination?.prev ?? "Prev"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={totalPages <= 1 || currentPage >= totalPages}
              >
                {texts?.pagination?.next ?? "Next"}
              </Button>
            </div>
          </div>

          {selectedUser ? (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
              onClick={() => setSelectedUser(null)}
            >
              <div
                className="relative w-full max-w-3xl rounded-2xl bg-card p-4 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="rounded-full p-2 cursor-pointer hover:scale-110 "
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div>
                      <div className="font-semibold">
                        {selectedUser.name || selectedUser.phoneNumber}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedUser.language || "-"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder={
                        texts?.messageSearchPlaceholder ?? "Search messages"
                      }
                      value={msgSearch}
                      onChange={(e) => setMsgSearch(e.target.value)}
                    />
                    <Button size="sm" onClick={() => loadMoreMessages(1)}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-auto">
                  {msgsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      {texts?.usersTable?.noMessages ?? "No messages."}
                    </div>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-lg border border-border/60 p-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="text-xs text-muted-foreground">
                            {new Date(m.createdAt).toLocaleString()}
                          </div>
                          <Badge
                            variant={m.role === "user" ? "accent" : "secondary"}
                          >
                            {texts?.roleLabels?.[
                              m.role as "user" | "assistant" | "system"
                            ] ?? m.role}
                          </Badge>
                        </div>
                        <div className="mt-1 text-sm">{m.content}</div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
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
                      onClick={() => loadMoreMessages(Math.max(1, msgPage - 1))}
                      disabled={msgPage <= 1 || msgsLoading}
                    >
                      {texts?.pagination?.prev ?? "Prev"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        loadMoreMessages(Math.min(msgTotalPages, msgPage + 1))
                      }
                      disabled={msgPage >= msgTotalPages || msgsLoading}
                    >
                      {texts?.pagination?.next ?? "Next"}
                    </Button>
                  </div>
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
