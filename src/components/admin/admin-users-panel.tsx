"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Edit3,
  ExternalLink,
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
import type { Locale } from "@/lib/locales";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
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
    setEditingId(user.id);
    setName(user.name ?? "");
    setEmail(user.email ?? "");
    setPhone(user.phone ?? "");
    setBio(user.bio ?? "");
    setPassword("");
    setRole(user.role);
    setStatus(user.status);
    setPlanId(user.planId ?? "free");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setEmail("");
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

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>
            {editingId
              ? locale === "ar"
                ? "تعديل مستخدم"
                : "Edit user"
              : locale === "ar"
                ? "إنشاء مستخدم جديد"
                : "Create a new user"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="user-name">
                {locale === "ar" ? "الاسم" : "Name"}
              </Label>
              <Input
                id="user-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={locale === "ar" ? "أحمد علي" : "John Doe"}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-email">
                {locale === "ar" ? "البريد الإلكتروني" : "Email"}
              </Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="john@example.com"
                required={!editingId}
                disabled={!!editingId}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-password">
                {locale === "ar" ? "كلمة المرور" : "Password"}
              </Label>
              <PasswordInput
                id="user-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={
                  editingId
                    ? locale === "ar"
                      ? "اتركها فارغة للاحتفاظ بكلمة المرور"
                      : "Leave empty to keep password"
                    : "••••••••"
                }
                required={!editingId}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-phone">
                {locale === "ar" ? "رقم الهاتف" : "Phone"}
              </Label>
              <Input
                id="user-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+971 50 000 0000"
              />
            </div>

            {editingId &&
            initialUsers.find((u: UserRow) => u.id === editingId)?.role ===
              "SELLER" ? (
              <div className="space-y-2">
                <Label htmlFor="user-bio">
                  {locale === "ar" ? "نبذة" : "Bio"}
                </Label>
                <Input
                  id="user-bio"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder={
                    locale === "ar"
                      ? "نبذة قصيرة عن البائع"
                      : "Short bio about the seller"
                  }
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="user-role">
                {locale === "ar" ? "الدور" : "Role"}
              </Label>
              <Select
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
              <Label htmlFor="user-status">
                {locale === "ar" ? "الحالة" : "Status"}
              </Label>
              <Select
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
              <Label htmlFor="user-plan">
                {locale === "ar" ? "الخطة" : "Plan"}
              </Label>
              <Select
                id="user-plan"
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

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 gap-2 cursor-pointer"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingId ? (
                  <Edit3 className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {editingId
                  ? locale === "ar"
                    ? "حفظ التغييرات"
                    : "Save changes"
                  : locale === "ar"
                    ? "إنشاء المستخدم"
                    : "Create user"}
              </Button>
              {editingId ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={cancelEdit}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  {locale === "ar" ? "إلغاء" : "Cancel"}
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>
            {locale === "ar" ? "المستخدمون الحاليون" : "Current users"}
          </CardTitle>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={reloadData}
              disabled={isRefreshing || loading}
              className="gap-2"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              {locale === "ar" ? "إعادة تحميل" : "Reload"}
            </Button>

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
              className="w-36"
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
              className="w-36"
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

            <Select
              value={currentPageSize}
              onChange={(e) => updatePageSize(e.target.value)}
              className="w-20"
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
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-150 text-left text-sm rtl:text-right">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border/70">
                <th className="pb-3 font-medium">
                  {locale === "ar" ? "الاسم" : "Name"}
                </th>
                <th className="pb-3 font-medium">
                  {locale === "ar" ? "البريد الإلكتروني" : "Email"}
                </th>
                <th className="pb-3 font-medium">
                  {locale === "ar" ? "الدور" : "Role"}
                </th>
                <th className="pb-3 font-medium">
                  {locale === "ar" ? "الحالة" : "Status"}
                </th>
                <th className="pb-3 font-medium">
                  {locale === "ar" ? "الخطة" : "Plan"}
                </th>
                <th className="pb-3 font-medium">
                  {locale === "ar" ? "إجراء" : "Action"}
                </th>
              </tr>
            </thead>
            <tbody>
              {initialUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-4 text-center text-sm text-muted-foreground"
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
                    <td className="py-4 font-medium">{user.name || "-"}</td>
                    <td className="py-4">{user.email || "-"}</td>
                    <td className="py-4">
                      <Badge variant={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <Badge
                        variant={
                          user.status === "ACTIVE" ? "accent" : "secondary"
                        }
                      >
                        {user.status}
                      </Badge>
                    </td>
                    <td className="py-4">
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
                    <td className="py-4">
                      <div className="flex gap-2">
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
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(user)}
                        >
                          <Edit3 className="h-4 w-4" />
                          {locale === "ar" ? "تعديل" : "Edit"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(user.id)}
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

          {initialUsers.length > 0 && totalPages > 1 ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/70 px-3 py-2">
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
