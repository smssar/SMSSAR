"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Edit3,
  ExternalLink,
  Eye,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/locales";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | string | null;
  phone?: string | null;
  bio?: string | null;
  role: "USER" | "SELLER" | "ADMIN";
  status: "ACTIVE" | "PENDING" | "FLAGGED";
  planId?: string | null;
  createdAt: Date | string;
};

type PlanOption = {
  id: string;
  title: string;
  title_ar: string | null;
  title_fr: string | null;
};

type PendingAction =
  | { type: "save"; label: string }
  | { type: "delete"; id: string; name: string }
  | null;

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background p-3">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 wrap-break-word text-sm font-medium text-foreground">
        {value}
      </div>
    </div>
  );
}

export function AdminUsersPanel({
  locale,
  initialUsers,
  plans,
  currentPage,
  totalPages,
}: {
  locale: Locale;
  initialUsers: UserRow[];
  plans: PlanOption[];
  currentPage: number;
  totalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRefreshing, startRefresh] = useTransition();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "SELLER" | "ADMIN">("USER");
  const [status, setStatus] = useState<"ACTIVE" | "PENDING" | "FLAGGED">(
    "ACTIVE",
  );
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const currentSearch = (searchParams.get("search") as string) ?? "";
  const currentRole = (searchParams.get("role") as string) ?? "";
  const currentStatus = (searchParams.get("status") as string) ?? "";
  const currentPageSize = (searchParams.get("pageSize") as string) ?? "10";

  const setPageParam = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    router.push(`?${params.toString()}`);
  };

  const updatePageSize = (pageSize: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (pageSize === "10") {
      params.delete("pageSize");
    } else {
      params.set("pageSize", pageSize);
    }
    params.delete("page"); // Reset to page 1 when changing page size
    router.push(`?${params.toString()}`);
  };

  const applyFilters = (
    newSearch: string,
    newRole: string,
    newStatus: string,
  ) => {
    const params = new URLSearchParams();
    if (newSearch) params.set("search", newSearch);
    if (newRole) params.set("role", newRole);
    if (newStatus) params.set("status", newStatus);
    if (currentPageSize !== "10") params.set("pageSize", currentPageSize);
    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("?");
  };

  const reloadData = () => {
    startRefresh(() => {
      router.refresh();
    });
  };

  const startEdit = (user: UserRow) => {
    setSelectedUser(user);
    setIsCreateDialogOpen(false);
    setEditingId(user.id);
    setName(user.name ?? "");
    setEmail(user.email ?? "");
    setEmailVerified(formatDateTimeLocal(user.emailVerified));
    setPhone(user.phone ?? "");
    setBio(user.bio ?? "");
    setPassword("");
    setRole(user.role);
    setStatus(user.status);
    setPlanId(user.planId ?? "free");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSelectedUser(null);
    setIsCreateDialogOpen(false);
    setName("");
    setEmail("");
    setEmailVerified("");
    setPhone("");
    setBio("");
    setPassword("");
    setRole("USER");
    setStatus("ACTIVE");
    setPlanId(plans[0]?.id ?? "");
  };

  const openCreateDialog = () => {
    setEditingId(null);
    setSelectedUser(null);
    setName("");
    setEmail("");
    setEmailVerified("");
    setPhone("");
    setBio("");
    setPassword("");
    setRole("USER");
    setStatus("ACTIVE");
    setPlanId(plans[0]?.id ?? "");
    setIsCreateDialogOpen(true);
  };

  const closeCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setName("");
    setEmail("");
    setEmailVerified("");
    setPhone("");
    setBio("");
    setPassword("");
    setRole("USER");
    setStatus("ACTIVE");
    setPlanId(plans[0]?.id ?? "");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPendingAction({
      type: "save",
      label:
        name.trim() ||
        email.trim() ||
        (locale === "ar" ? "هذا المستخدم" : "this user"),
    });
  };

  const performSave = async () => {
    setLoading(true);
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const response = editingId
        ? await fetch(`${origin}/api/admin/users/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              phone,
              bio,
              password: password || null,
              emailVerified: emailVerified || null,
              role,
              status,
              planId,
            }),
          })
        : await fetch(`${origin}/api/admin/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              email,
              phone,
              bio,
              password,
              emailVerified: emailVerified || null,
              role,
              status,
              planId,
            }),
          });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Status ${response.status}`);
      }

      cancelEdit();
      setPendingAction(null);
      reloadData();
      toast.success(locale === "ar" ? "تم حفظ المستخدم." : "User saved.");
    } catch (error) {
      console.error("Failed to save user:", error);
      toast.error(
        locale === "ar" ? "تعذر حفظ المستخدم." : "Could not save the user.",
      );
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  const handleDelete = (id: string) => {
    const user = initialUsers.find((item) => item.id === id);
    setPendingAction({ type: "delete", id, name: user?.name ?? "" });
  };

  const performDelete = async (id: string) => {
    setLoading(true);
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const response = await fetch(`${origin}/api/admin/users/${id}`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Status ${response.status}`);
      }

      if (editingId === id) cancelEdit();
      reloadData();
      toast.success(locale === "ar" ? "تم حذف المستخدم." : "User deleted.");
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error(
        locale === "ar" ? "تعذر حذف المستخدم." : "Could not delete the user.",
      );
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  const confirmTitle =
    pendingAction?.type === "save"
      ? locale === "ar"
        ? "تأكيد الحفظ"
        : "Confirm save"
      : locale === "ar"
        ? "تأكيد الحذف"
        : "Confirm delete";

  const confirmMessage =
    pendingAction?.type === "save"
      ? locale === "ar"
        ? `هل تريد حفظ التغييرات لـ "${pendingAction.label}"؟`
        : `Save changes for "${pendingAction.label}"?`
      : locale === "ar"
        ? `هل تريد حذف المستخدم "${pendingAction?.name ?? ""}"؟`
        : `Delete user "${pendingAction?.name ?? ""}"?`;

  const confirmButtonLabel =
    pendingAction?.type === "save"
      ? locale === "ar"
        ? "حفظ"
        : "Save"
      : locale === "ar"
        ? "حذف"
        : "Delete";

  const getRoleBadgeColor = (userRole: string) => {
    if (userRole === "ADMIN") return "accent";
    if (userRole === "SELLER") return "secondary";
    return "secondary";
  };

  const getPlanLabel = (plan: PlanOption) =>
    locale === "ar"
      ? plan.title_ar || plan.title
      : locale === "fr"
        ? plan.title_fr || plan.title
        : plan.title;

  function formatDateTimeLocal(value: Date | string | null): string {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const pad = (num: number) => String(num).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate(),
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function formatVerifiedAt(
    value: Date | string | null,
    currentLocale: Locale,
  ): string {
    if (!value) {
      return currentLocale === "ar" ? "غير معتمد" : "Not verified";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return currentLocale === "ar" ? "غير معتمد" : "Not verified";
    }

    return date.toLocaleString(
      currentLocale === "ar" ? "ar" : currentLocale === "fr" ? "fr" : "en",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  }

  function formatCreatedAt(
    value: Date | string,
    currentLocale: Locale,
  ): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString(
      currentLocale === "ar" ? "ar" : currentLocale === "fr" ? "fr" : "en",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/70">
        <CardHeader className="flex flex-col gap-4 border-b border-border/60 pb-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>
                {locale === "ar" ? "المستخدمون الحاليون" : "Current users"}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {locale === "ar"
                  ? "راجع كل المستخدمين، وحرّر أي حساب من نافذة التفاصيل."
                  : "Review all users and edit any account from the details dialog."}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={reloadData}
              disabled={isRefreshing || loading}
              className="gap-2 self-start"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              {locale === "ar" ? "إعادة تحميل" : "Reload"}
            </Button>
            <Button
              type="button"
              variant="accent"
              onClick={openCreateDialog}
              className="gap-2 self-start"
            >
              <Plus className="h-4 w-4" />
              {locale === "ar" ? "إنشاء مستخدم" : "Create user"}
            </Button>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_140px_140px_120px]">
            <Input
              id="user-search"
              className="flex-1"
              placeholder={
                locale === "ar"
                  ? "ابحث بالاسم أو البريد..."
                  : "Search name, email..."
              }
              value={currentSearch}
              onChange={(e) =>
                applyFilters(e.target.value, currentRole, currentStatus)
              }
            />

            <Select
              value={currentRole}
              onChange={(e) =>
                applyFilters(currentSearch, e.target.value, currentStatus)
              }
            >
              <option value="">
                {locale === "ar" ? "كل الأدوار" : "All roles"}
              </option>
              <option value="USER">
                {locale === "ar" ? "مستخدم" : "User"}
              </option>
              <option value="SELLER">
                {locale === "ar" ? "بائع" : "Seller"}
              </option>
              <option value="ADMIN">
                {locale === "ar" ? "مدير" : "Admin"}
              </option>
            </Select>

            <Select
              value={currentStatus}
              onChange={(e) =>
                applyFilters(currentSearch, currentRole, e.target.value)
              }
            >
              <option value="">
                {locale === "ar" ? "كل الحالات" : "All status"}
              </option>
              <option value="ACTIVE">
                {locale === "ar" ? "نشط" : "Active"}
              </option>
              <option value="PENDING">
                {locale === "ar" ? "قيد الانتظار" : "Pending"}
              </option>
              <option value="FLAGGED">
                {locale === "ar" ? "معلم" : "Flagged"}
              </option>
            </Select>

            <div className="flex items-center gap-2">
              <Select
                value={currentPageSize}
                onChange={(e) => updatePageSize(e.target.value)}
                className="w-full"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </Select>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 md:hidden">
            {initialUsers.length === 0 ? (
              <div className="rounded-3xl border border-border/60 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                {locale === "ar" ? "لا توجد مستخدمون بعد." : "No users yet."}
              </div>
            ) : (
              initialUsers.map((user) => (
                <Card key={user.id} className="border-border/70">
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-base font-semibold">
                          {user.name || "-"}
                        </div>
                        <div className="truncate text-sm text-muted-foreground">
                          {user.email || "-"}
                        </div>
                      </div>
                      <Badge variant={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <InfoPill
                        label={locale === "ar" ? "الحالة" : "Status"}
                        value={user.status}
                      />
                      <InfoPill
                        label={locale === "ar" ? "التحقق" : "Verified"}
                        value={formatVerifiedAt(user.emailVerified, locale)}
                      />
                      <InfoPill
                        label={locale === "ar" ? "الهاتف" : "Phone"}
                        value={user.phone || "-"}
                      />
                      <InfoPill
                        label={locale === "ar" ? "التاريخ" : "Created"}
                        value={formatCreatedAt(user.createdAt, locale)}
                      />
                    </div>

                    {user.bio ? (
                      <p className="rounded-2xl bg-muted/40 p-3 text-sm leading-6 text-muted-foreground">
                        {user.bio}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {getPlanLabel(
                          plans.find((plan) => plan.id === user.planId) ?? {
                            id: user.planId ?? "",
                            title: user.planId ?? "",
                            title_ar: null,
                            title_fr: null,
                          },
                        )}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {user.role !== "ADMIN" ? (
                        <ButtonLink
                          href={
                            user.role === "SELLER"
                              ? `/${locale}/sellers/${user.id}`
                              : `/${locale}/profile/${user.id}`
                          }
                          target="_blank"
                          variant="outline"
                          size="sm"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {locale === "ar" ? "الملف العام" : "Public profile"}
                        </ButtonLink>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="gap-2"
                        onClick={() => startEdit(user)}
                      >
                        <Eye className="h-4 w-4" />
                        {locale === "ar" ? "تفاصيل" : "Manage"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(user.id)}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        {locale === "ar" ? "حذف" : "Delete"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto rounded-3xl border border-border/60">
            <table className="min-w-295 w-full text-left text-sm rtl:text-right">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr className="border-b border-border/70">
                  <th className="px-4 py-3 font-medium">
                    {locale === "ar" ? "الاسم" : "Name"}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {locale === "ar" ? "البريد الإلكتروني" : "Email"}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {locale === "ar" ? "الهاتف" : "Phone"}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {locale === "ar" ? "الدور" : "Role"}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {locale === "ar" ? "الحالة" : "Status"}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {locale === "ar" ? "التحقق" : "Verified at"}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {locale === "ar" ? "الخطة" : "Plan"}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {locale === "ar" ? "تاريخ الإنشاء" : "Created at"}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {locale === "ar" ? "إجراء" : "Action"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {initialUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-sm text-muted-foreground"
                    >
                      {locale === "ar"
                        ? "لا توجد مستخدمون بعد."
                        : "No users yet."}
                    </td>
                  </tr>
                ) : (
                  initialUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-4 py-4 font-medium">
                        {user.name || "-"}
                      </td>
                      <td className="px-4 py-4">{user.email || "-"}</td>
                      <td className="px-4 py-4">{user.phone || "-"}</td>
                      <td className="px-4 py-4">
                        <Badge variant={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={
                            user.status === "ACTIVE" ? "accent" : "secondary"
                          }
                        >
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {formatVerifiedAt(user.emailVerified, locale)}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="secondary">
                          {getPlanLabel(
                            plans.find((plan) => plan.id === user.planId) ?? {
                              id: user.planId ?? "",
                              title: user.planId ?? "",
                              title_ar: null,
                              title_fr: null,
                            },
                          )}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {formatCreatedAt(user.createdAt, locale)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {user.role !== "ADMIN" ? (
                            <ButtonLink
                              href={
                                user.role === "SELLER"
                                  ? `/${locale}/sellers/${user.id}`
                                  : `/${locale}/profile/${user.id}`
                              }
                              target="_blank"
                              variant="outline"
                              size="sm"
                            >
                              <ExternalLink className="h-4 w-4" />
                              {locale === "ar" ? "الملف العام" : "Public"}
                            </ButtonLink>
                          ) : null}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(user)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            {locale === "ar" ? "تفاصيل" : "Manage"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(user.id)}
                            className="gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            {locale === "ar" ? "حذف" : "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {initialUsers.length > 0 && totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/70 px-3 py-2">
              <span className="text-xs text-muted-foreground">
                {locale === "ar" ? "الصفحة" : "Page"} {currentPage} /{" "}
                {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPageParam(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  {locale === "ar" ? "السابق" : "Previous"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPageParam(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  {locale === "ar" ? "التالي" : "Next"}
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {isCreateDialogOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 px-4 py-8 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-4xl rounded-3xl border border-border/70 bg-card p-0 shadow-2xl">
            <div className="flex items-start justify-between border-b border-border/60 px-6 py-5">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {locale === "ar" ? "إنشاء مستخدم جديد" : "Create user"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {locale === "ar"
                    ? "أضف مستخدمًا جديدًا مع بياناته الكاملة من هذه النافذة."
                    : "Add a new user with full details from this dialog."}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={closeCreateDialog}
                className="gap-2"
                disabled={loading}
              >
                <X className="h-4 w-4" />
                {locale === "ar" ? "إغلاق" : "Close"}
              </Button>
            </div>

            <form
              className="space-y-5 p-6"
              onSubmit={(event) => {
                event.preventDefault();
                handleSubmit(event);
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="create-user-name">
                    {locale === "ar" ? "الاسم" : "Name"}
                  </Label>
                  <Input
                    id="create-user-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={locale === "ar" ? "أحمد علي" : "John Doe"}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-user-email">
                    {locale === "ar" ? "البريد الإلكتروني" : "Email"}
                  </Label>
                  <Input
                    id="create-user-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="create-user-password">
                    {locale === "ar" ? "كلمة المرور" : "Password"}
                  </Label>
                  <PasswordInput
                    id="create-user-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-user-phone">
                    {locale === "ar" ? "رقم الهاتف" : "Phone"}
                  </Label>
                  <Input
                    id="create-user-phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+971 50 000 0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-user-email-verified">
                  {locale === "ar"
                    ? "تم التحقق من البريد"
                    : "Email verified at"}
                </Label>
                <Input
                  id="create-user-email-verified"
                  type="datetime-local"
                  value={emailVerified}
                  onChange={(event) => setEmailVerified(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {locale === "ar"
                    ? "اتركه فارغًا إذا لم يتم التحقق من البريد بعد."
                    : "Leave blank if the email has not been verified yet."}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-user-bio">
                  {locale === "ar" ? "نبذة" : "Bio"}
                </Label>
                <Textarea
                  id="create-user-bio"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  rows={4}
                  placeholder={
                    locale === "ar"
                      ? "نبذة قصيرة عن المستخدم"
                      : "Short bio about the user"
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="create-user-role">
                    {locale === "ar" ? "الدور" : "Role"}
                  </Label>
                  <Select
                    id="create-user-role"
                    value={role}
                    onChange={(event) =>
                      setRole(event.target.value as "USER" | "SELLER" | "ADMIN")
                    }
                  >
                    <option value="USER">
                      {locale === "ar" ? "مستخدم" : "User"}
                    </option>
                    <option value="SELLER">
                      {locale === "ar" ? "بائع" : "Seller"}
                    </option>
                    <option value="ADMIN">
                      {locale === "ar" ? "مدير" : "Admin"}
                    </option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-user-status">
                    {locale === "ar" ? "الحالة" : "Status"}
                  </Label>
                  <Select
                    id="create-user-status"
                    value={status}
                    onChange={(event) =>
                      setStatus(
                        event.target.value as "ACTIVE" | "PENDING" | "FLAGGED",
                      )
                    }
                  >
                    <option value="ACTIVE">
                      {locale === "ar" ? "نشط" : "Active"}
                    </option>
                    <option value="PENDING">
                      {locale === "ar" ? "قيد الانتظار" : "Pending"}
                    </option>
                    <option value="FLAGGED">
                      {locale === "ar" ? "معلم" : "Flagged"}
                    </option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-user-plan">
                    {locale === "ar" ? "الخطة" : "Plan"}
                  </Label>
                  <Select
                    id="create-user-plan"
                    value={planId}
                    onChange={(event) => setPlanId(event.target.value)}
                  >
                    {plans.length === 0 ? (
                      <option value="">
                        {locale === "ar"
                          ? "لا توجد باقات بعد"
                          : "No plans available yet"}
                      </option>
                    ) : (
                      plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {getPlanLabel(plan)}
                        </option>
                      ))
                    )}
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  className="gap-2"
                  onClick={closeCreateDialog}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                  {locale === "ar" ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="submit" className="gap-2" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {locale === "ar" ? "إنشاء المستخدم" : "Create user"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {selectedUser ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 px-4 py-8 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-5xl rounded-3xl border border-border/70 bg-card p-0 shadow-2xl">
            <div className="flex items-start justify-between border-b border-border/60 px-6 py-5">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {locale === "ar" ? "تفاصيل المستخدم" : "Manage user"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {locale === "ar"
                    ? "حرّر أي حقل، ثم احفظ التغييرات من هنا مباشرة."
                    : "Edit any field and save changes directly from this dialog."}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={cancelEdit}
                className="gap-2"
                disabled={loading}
              >
                <X className="h-4 w-4" />
                {locale === "ar" ? "إغلاق" : "Close"}
              </Button>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_1.1fr]">
              <div className="space-y-4 rounded-3xl border border-border/70 bg-muted/20 p-5">
                <div>
                  <div className="text-sm text-muted-foreground">
                    {locale === "ar" ? "الاسم" : "Name"}
                  </div>
                  <div className="mt-1 text-2xl font-semibold">
                    {selectedUser.name || "-"}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoPill
                    label={locale === "ar" ? "البريد" : "Email"}
                    value={selectedUser.email || "-"}
                  />
                  <InfoPill
                    label={locale === "ar" ? "الهاتف" : "Phone"}
                    value={selectedUser.phone || "-"}
                  />
                  <InfoPill
                    label={locale === "ar" ? "الدور" : "Role"}
                    value={selectedUser.role}
                  />
                  <InfoPill
                    label={locale === "ar" ? "الحالة" : "Status"}
                    value={selectedUser.status}
                  />
                  <InfoPill
                    label={locale === "ar" ? "التحقق" : "Verified at"}
                    value={formatVerifiedAt(selectedUser.emailVerified, locale)}
                  />
                  <InfoPill
                    label={locale === "ar" ? "التاريخ" : "Created"}
                    value={formatCreatedAt(selectedUser.createdAt, locale)}
                  />
                </div>

                <div className="rounded-2xl border border-border/60 bg-background p-4">
                  <div className="text-sm text-muted-foreground">
                    {locale === "ar" ? "الخطة" : "Plan"}
                  </div>
                  <div className="mt-2">
                    <Badge variant="secondary">
                      {getPlanLabel(
                        plans.find(
                          (plan) => plan.id === selectedUser.planId,
                        ) ?? {
                          id: selectedUser.planId ?? "",
                          title: selectedUser.planId ?? "",
                          title_ar: null,
                          title_fr: null,
                        },
                      )}
                    </Badge>
                  </div>
                </div>

                {selectedUser.bio ? (
                  <div className="rounded-2xl border border-border/60 bg-background p-4">
                    <div className="text-sm text-muted-foreground">
                      {locale === "ar" ? "نبذة" : "Bio"}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-foreground/90">
                      {selectedUser.bio}
                    </p>
                  </div>
                ) : null}
              </div>

              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void performSave();
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dialog-user-name">
                      {locale === "ar" ? "الاسم" : "Name"}
                    </Label>
                    <Input
                      id="dialog-user-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dialog-user-email">
                      {locale === "ar" ? "البريد الإلكتروني" : "Email"}
                    </Label>
                    <Input
                      id="dialog-user-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required={!editingId}
                      disabled={!!editingId}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dialog-user-phone">
                      {locale === "ar" ? "رقم الهاتف" : "Phone"}
                    </Label>
                    <Input
                      id="dialog-user-phone"
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dialog-user-email-verified">
                      {locale === "ar"
                        ? "تم التحقق من البريد"
                        : "Email verified at"}
                    </Label>
                    <Input
                      id="dialog-user-email-verified"
                      type="datetime-local"
                      value={emailVerified}
                      onChange={(event) => setEmailVerified(event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dialog-user-password">
                    {locale === "ar" ? "كلمة المرور" : "Password"}
                  </Label>
                  <PasswordInput
                    id="dialog-user-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={
                      locale === "ar"
                        ? "اتركه فارغًا إذا لا تريد تغييره"
                        : "Leave empty to keep current password"
                    }
                    required={!editingId}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dialog-user-bio">
                    {locale === "ar" ? "نبذة" : "Bio"}
                  </Label>
                  <Textarea
                    id="dialog-user-bio"
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="dialog-user-role">
                      {locale === "ar" ? "الدور" : "Role"}
                    </Label>
                    <Select
                      id="dialog-user-role"
                      value={role}
                      onChange={(event) =>
                        setRole(
                          event.target.value as "USER" | "SELLER" | "ADMIN",
                        )
                      }
                    >
                      <option value="USER">
                        {locale === "ar" ? "مستخدم" : "User"}
                      </option>
                      <option value="SELLER">
                        {locale === "ar" ? "بائع" : "Seller"}
                      </option>
                      <option value="ADMIN">
                        {locale === "ar" ? "مدير" : "Admin"}
                      </option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dialog-user-status">
                      {locale === "ar" ? "الحالة" : "Status"}
                    </Label>
                    <Select
                      id="dialog-user-status"
                      value={status}
                      onChange={(event) =>
                        setStatus(
                          event.target.value as
                            | "ACTIVE"
                            | "PENDING"
                            | "FLAGGED",
                        )
                      }
                    >
                      <option value="ACTIVE">
                        {locale === "ar" ? "نشط" : "Active"}
                      </option>
                      <option value="PENDING">
                        {locale === "ar" ? "قيد الانتظار" : "Pending"}
                      </option>
                      <option value="FLAGGED">
                        {locale === "ar" ? "معلم" : "Flagged"}
                      </option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dialog-user-plan">
                      {locale === "ar" ? "الخطة" : "Plan"}
                    </Label>
                    <Select
                      id="dialog-user-plan"
                      value={planId}
                      onChange={(event) => setPlanId(event.target.value)}
                    >
                      {plans.length === 0 ? (
                        <option value="">
                          {locale === "ar"
                            ? "لا توجد باقات بعد"
                            : "No plans available yet"}
                        </option>
                      ) : (
                        plans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {getPlanLabel(plan)}
                          </option>
                        ))
                      )}
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    className="gap-2"
                    onClick={() => handleDelete(selectedUser.id)}
                    disabled={loading || selectedUser.role === "ADMIN"}
                  >
                    <Trash2 className="h-4 w-4" />
                    {locale === "ar" ? "حذف المستخدم" : "Delete user"}
                  </Button>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="button"
                      variant="ghost"
                      className="gap-2"
                      onClick={cancelEdit}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                      {locale === "ar" ? "إلغاء" : "Cancel"}
                    </Button>
                    <Button type="submit" className="gap-2" disabled={loading}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Edit3 className="h-4 w-4" />
                      )}
                      {locale === "ar" ? "حفظ التغييرات" : "Save changes"}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {pendingAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border/70 bg-card p-6 shadow-2xl">
            <div
              className={
                pendingAction.type === "save"
                  ? "mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400"
                  : "mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400"
              }
            >
              {pendingAction.type === "save" ? (
                <Edit3 className="h-6 w-6" />
              ) : (
                <Trash2 className="h-6 w-6" />
              )}
            </div>

            <h2 className="text-2xl font-semibold tracking-tight">
              {confirmTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {confirmMessage}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPendingAction(null)}
                className="gap-2"
                disabled={loading}
              >
                <X className="h-4 w-4" />
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                type="button"
                variant={pendingAction.type === "delete" ? "accent" : "default"}
                onClick={() => {
                  if (pendingAction.type === "save") {
                    void performSave();
                  } else {
                    void performDelete(pendingAction.id);
                  }
                }}
                className="gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {pendingAction.type === "save"
                      ? locale === "ar"
                        ? "جارٍ الحفظ..."
                        : "Saving..."
                      : locale === "ar"
                        ? "جارٍ الحذف..."
                        : "Deleting..."}
                  </>
                ) : (
                  <>
                    {pendingAction.type === "save" ? (
                      <Edit3 className="h-4 w-4" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    {confirmButtonLabel}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
