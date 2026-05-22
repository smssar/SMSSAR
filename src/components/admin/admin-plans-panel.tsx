"use client";

import { useMemo, useState } from "react";
import { Edit3, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/locales";
import { formatCurrency } from "@/lib/format";

type PlanRow = {
  id: string;
  title: string;
  title_ar: string | null;
  title_fr: string | null;
  description: string;
  description_ar: string | null;
  description_fr: string | null;
  price: number;
  listings: number | null;
  featured: boolean;
};

type FormState = {
  id: string;
  title: string;
  titleAr: string;
  titleFr: string;
  description: string;
  descriptionAr: string;
  descriptionFr: string;
  price: string;
  listings: string;
  featured: boolean;
};

const emptyForm = (): FormState => ({
  id: "",
  title: "",
  titleAr: "",
  titleFr: "",
  description: "",
  descriptionAr: "",
  descriptionFr: "",
  price: "0",
  listings: "",
  featured: false,
});

export function AdminPlansPanel({
  locale,
  initialPlans,
}: {
  locale: Locale;
  initialPlans: PlanRow[];
}) {
  const [plans, setPlans] = useState(initialPlans);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => a.price - b.price),
    [plans],
  );

  const reset = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const startEdit = (plan: PlanRow) => {
    setEditingId(plan.id);
    setForm({
      id: plan.id,
      title: plan.title,
      titleAr: plan.title_ar ?? "",
      titleFr: plan.title_fr ?? "",
      description: plan.description,
      descriptionAr: plan.description_ar ?? "",
      descriptionFr: plan.description_fr ?? "",
      price: String(plan.price),
      listings: plan.listings === null ? "" : String(plan.listings),
      featured: plan.featured,
    });
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      id: form.id.trim().toLowerCase(),
      title: form.title.trim(),
      title_ar: form.titleAr.trim() || undefined,
      title_fr: form.titleFr.trim() || undefined,
      description: form.description.trim(),
      description_ar: form.descriptionAr.trim() || undefined,
      description_fr: form.descriptionFr.trim() || undefined,
      price: Number(form.price || 0),
      listings: form.listings.trim() === "" ? null : Number(form.listings),
      featured: form.featured,
    };

    if (!payload.id || !payload.title || !payload.description) {
      toast.error(
        locale === "ar" ? "املأ الحقول المطلوبة." : "Fill required fields.",
      );
      return;
    }

    setCreating(!editingId);
    setSaving(Boolean(editingId));

    try {
      const response = await fetch(
        editingId ? `/api/plans/${editingId}` : "/api/plans",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error || `Status ${response.status}`);
      }

      const nextPlan = body?.data as PlanRow | undefined;
      if (nextPlan) {
        setPlans((current) =>
          editingId
            ? current.map((plan) => (plan.id === nextPlan.id ? nextPlan : plan))
            : [nextPlan, ...current],
        );
      }

      reset();
      toast.success(locale === "ar" ? "تم حفظ الباقة." : "Plan saved.");
    } catch (error) {
      console.error("Failed to save plan:", error);
      toast.error(
        locale === "ar" ? "تعذر حفظ الباقة." : "Could not save plan.",
      );
    } finally {
      setCreating(false);
      setSaving(false);
    }
  };

  const confirmDelete = (id: string) => setPendingDeleteId(id);

  const performDelete = async (id: string) => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/plans/${id}`, { method: "DELETE" });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error || `Status ${response.status}`);
      }
      setPlans((current) => current.filter((plan) => plan.id !== id));
      toast.success(locale === "ar" ? "تم حذف الباقة." : "Plan deleted.");
    } catch (error) {
      console.error("Failed to delete plan:", error);
      toast.error(
        locale === "ar" ? "تعذر حذف الباقة." : "Could not delete plan.",
      );
    } finally {
      setPendingDeleteId(null);
      setDeleting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>
            {editingId
              ? locale === "ar"
                ? "تعديل باقة"
                : "Edit plan"
              : locale === "ar"
                ? "إضافة باقة"
                : "Add a plan"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="plan-id">ID</Label>
              <Input
                id="plan-id"
                value={form.id}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, id: e.target.value }))
                }
                disabled={Boolean(editingId)}
                placeholder="free"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-title">English title</Label>
              <Input
                id="plan-title"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Free"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-title-ar">Arabic title</Label>
              <Input
                id="plan-title-ar"
                value={form.titleAr}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, titleAr: e.target.value }))
                }
                placeholder="مجاني"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-title-fr">French title</Label>
              <Input
                id="plan-title-fr"
                value={form.titleFr}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, titleFr: e.target.value }))
                }
                placeholder="Gratuit"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-description">English description</Label>
              <Input
                id="plan-description"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-description-ar">Arabic description</Label>
              <Input
                id="plan-description-ar"
                value={form.descriptionAr}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    descriptionAr: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-description-fr">French description</Label>
              <Input
                id="plan-description-fr"
                value={form.descriptionFr}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    descriptionFr: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="plan-price">Price</Label>
                <Input
                  id="plan-price"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, price: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-listings">Listings</Label>
                <Input
                  id="plan-listings"
                  type="number"
                  min={0}
                  value={form.listings}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, listings: e.target.value }))
                  }
                  placeholder="3"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="plan-featured"
                type="checkbox"
                checked={form.featured}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, featured: e.target.checked }))
                }
              />
              <Label htmlFor="plan-featured">Featured</Label>
            </div>
            <Button
              type="submit"
              className="w-full gap-2"
              disabled={creating || saving}
            >
              {creating || saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {editingId
                ? locale === "ar"
                  ? "حفظ"
                  : "Save"
                : locale === "ar"
                  ? "إنشاء الباقة"
                  : "Create plan"}
            </Button>
            {editingId ? (
              <Button
                type="button"
                variant="ghost"
                className="w-full gap-2"
                onClick={reset}
                disabled={saving}
              >
                <X className="h-4 w-4" />
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </Button>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "الباقات الحالية" : "Current plans"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedPlans.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {locale === "ar" ? "لا توجد باقات بعد." : "No plans yet."}
            </p>
          ) : (
            sortedPlans.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/70 px-4 py-3 text-sm lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <div className="font-medium">{plan.title}</div>
                  <div className="text-muted-foreground">
                    {plan.id} •{" "}
                    {plan.price === 0
                      ? locale === "ar"
                        ? "مجاني"
                        : "Free"
                      : formatCurrency(plan.price, locale)}
                  </div>
                  <div className="text-muted-foreground">
                    {plan.description}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(plan)}
                  >
                    <Edit3 className="h-4 w-4" />
                    {locale === "ar" ? "تعديل" : "Edit"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => confirmDelete(plan.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    {locale === "ar" ? "حذف" : "Delete"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {pendingDeleteId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border/70 bg-card p-6 shadow-2xl">
            <h2 className="text-2xl font-semibold tracking-tight">
              {locale === "ar" ? "تأكيد الحذف" : "Confirm delete"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {locale === "ar"
                ? "هل تريد حذف هذه الباقة؟"
                : "Delete this plan?"}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPendingDeleteId(null)}
                disabled={deleting}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                type="button"
                variant="accent"
                onClick={() => performDelete(pendingDeleteId)}
                disabled={deleting}
                className="gap-2"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {locale === "ar" ? "حذف" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
