"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Edit3, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/locales";

type CategoryRow = {
  id: string;
  name: string;
  name_en?: string;
  name_ar?: string | null;
  name_fr?: string | null;
  slug: string | null;
  _count?: { properties: number };
};

export function AdminCategoriesPanel({
  locale,
  initialCategories,
}: {
  locale: Locale;
  initialCategories: CategoryRow[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [slug, setSlug] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanedNameEn = nameEn.trim();
    if (!cleanedNameEn) {
      toast.error(
        locale === "ar"
          ? "اسم الفئة بالإنجليزية مطلوب."
          : "English category name is required.",
      );
      return;
    }

    const isEditing = Boolean(editingId);
    if (isEditing) {
      setSaving(true);
    } else {
      setCreating(true);
    }

    try {
      const response = await fetch(
        editingId ? `/api/categories/${editingId}` : "/api/categories",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name_en: cleanedNameEn,
            name_ar: nameAr.trim() || undefined,
            name_fr: nameFr.trim() || undefined,
            slug: slug.trim() || undefined,
          }),
        },
      );

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Status ${response.status}`);
      }

      const savedCategory = payload?.data as CategoryRow | undefined;
      if (savedCategory) {
        setCategories((current) =>
          editingId
            ? current.map((category) =>
                category.id === savedCategory.id ? savedCategory : category,
              )
            : [savedCategory, ...current],
        );
      }

      setNameEn("");
      setNameAr("");
      setNameFr("");
      setSlug("");

      if (isEditing) {
        setEditingId(null);
        toast.success(
          locale === "ar" ? "تم تحديث الفئة." : "Category updated.",
        );
      } else {
        toast.success(
          locale === "ar" ? "تم إنشاء الفئة." : "Category created.",
        );
      }
    } catch (error) {
      console.error(
        isEditing ? "Failed to update category:" : "Failed to create category:",
        error,
      );
      toast.error(
        locale === "ar"
          ? isEditing
            ? "تعذر تحديث الفئة."
            : "تعذر إنشاء الفئة."
          : isEditing
            ? "Could not update the category."
            : "Could not create the category.",
      );
    } finally {
      setCreating(false);
      setSaving(false);
    }
  };

  const startEdit = (category: CategoryRow) => {
    setEditingId(category.id);
    setNameEn(category.name_en || category.name || "");
    setNameAr(category.name_ar || "");
    setNameFr(category.name_fr || "");
    setSlug(category.slug || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNameEn("");
    setNameAr("");
    setNameFr("");
    setSlug("");
  };

  const confirmDelete = (id: string) => {
    setPendingDeleteId(id);
  };

  const performDelete = async (id: string) => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Status ${response.status}`);
      }

      setCategories((current) => current.filter((c) => c.id !== id));
      toast.success(locale === "ar" ? "تم حذف الفئة." : "Category deleted.");
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast.error(
        locale === "ar" ? "تعذر حذف الفئة." : "Could not delete category.",
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
                ? "تعديل الفئة"
                : "Edit category"
              : locale === "ar"
                ? "إنشاء فئة جديدة"
                : "Create a new category"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="category-name-en">English name</Label>
              <Input
                id="category-name-en"
                value={nameEn}
                onChange={(event) => setNameEn(event.target.value)}
                placeholder="Villas"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-name-ar">Arabic name</Label>
              <Input
                id="category-name-ar"
                value={nameAr}
                onChange={(event) => setNameAr(event.target.value)}
                placeholder="فلل"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-name-fr">French name</Label>
              <Input
                id="category-name-fr"
                value={nameFr}
                onChange={(event) => setNameFr(event.target.value)}
                placeholder="Villas"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-slug">
                {locale === "ar" ? "المعرف (اختياري)" : "Slug (optional)"}
              </Label>
              <Input
                id="category-slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="villas"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 gap-2"
                disabled={creating || saving}
              >
                {creating || saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingId ? (
                  <Edit3 className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {editingId
                  ? locale === "ar"
                    ? "حفظ التعديلات"
                    : "Save changes"
                  : locale === "ar"
                    ? "إنشاء الفئة"
                    : "Create category"}
              </Button>

              {editingId ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "الفئات الحالية" : "Current categories"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {locale === "ar" ? "لا توجد فئات بعد." : "No categories yet."}
            </p>
          ) : (
            sortedCategories.map((category) => (
              <div
                key={category.id}
                className={`flex items-center justify-between rounded-2xl border border-border/70 px-4 py-3 text-sm ${editingId === category.id ? "bg-muted/40 ring-1 ring-violet-500/20" : ""}`}
              >
                <div className="flex-1">
                  <div className="font-medium">
                    {category[`name_${locale}`] || category.name}
                  </div>
                  <div className="text-muted-foreground">{category.slug}</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground mr-4">
                    {category._count?.properties ?? 0}{" "}
                    {locale === "ar" ? "عقار" : "properties"}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(category)}
                    >
                      <Edit3 className="h-4 w-4" />
                      {locale === "ar" ? "تعديل" : "Edit"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => confirmDelete(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      {locale === "ar" ? "حذف" : "Delete"}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {pendingDeleteId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border/70 bg-card p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Trash2 className="h-6 w-6" />
            </div>

            <h2 className="text-2xl font-semibold tracking-tight">
              {locale === "ar" ? "تأكيد الحذف" : "Confirm delete"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {locale === "ar"
                ? "هل تريد حذف هذه الفئة؟"
                : "Delete this category?"}
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
                onClick={() => performDelete(pendingDeleteId!)}
                className="gap-2"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {locale === "ar" ? "جارٍ الحذف..." : "Deleting..."}
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    {locale === "ar" ? "حذف" : "Delete"}
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
