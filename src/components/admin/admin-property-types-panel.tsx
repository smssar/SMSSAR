"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Edit3, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/locales";

type PropertyTypeRow = {
  id: string;
  name: string;
  name_en?: string;
  name_ar?: string | null;
  name_fr?: string | null;
  slug: string | null;
  _count?: { properties: number };
};

export function AdminPropertyTypesPanel({
  locale,
  initialPropertyTypes,
}: {
  locale: Locale;
  initialPropertyTypes: PropertyTypeRow[];
}) {
  const [propertyTypes, setPropertyTypes] = useState(initialPropertyTypes);
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [slug, setSlug] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const sortedPropertyTypes = useMemo(
    () => [...propertyTypes].sort((a, b) => a.name.localeCompare(b.name)),
    [propertyTypes],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanedNameEn = nameEn.trim();
    if (!cleanedNameEn) {
      toast.error(
        locale === "ar"
          ? "اسم نوع العقار بالإنجليزية مطلوب."
          : "English property type name is required.",
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
        editingId ? `/api/property-types/${editingId}` : "/api/property-types",
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
        const message = payload?.error || `Status ${response.status}`;
        if (locale === "ar" && /slug already exists/i.test(message)) {
          toast.error("هذا المعرف موجود مسبقًا.");
        } else {
          toast.error(message);
        }
        return;
      }

      const savedPropertyType = payload?.data as PropertyTypeRow | undefined;
      if (savedPropertyType) {
        setPropertyTypes((current) =>
          editingId
            ? current.map((propertyType) =>
                propertyType.id === savedPropertyType.id
                  ? savedPropertyType
                  : propertyType,
              )
            : [savedPropertyType, ...current],
        );
      }

      setNameEn("");
      setNameAr("");
      setNameFr("");
      setSlug("");

      if (isEditing) {
        setEditingId(null);
        toast.success(
          locale === "ar" ? "تم تحديث نوع العقار." : "Property type updated.",
        );
      } else {
        toast.success(
          locale === "ar" ? "تم إنشاء نوع العقار." : "Property type created.",
        );
      }
    } catch (error) {
      console.error(
        isEditing
          ? "Failed to update property type:"
          : "Failed to create property type:",
        error,
      );
      toast.error(
        locale === "ar"
          ? isEditing
            ? "تعذر تحديث نوع العقار."
            : "تعذر إنشاء نوع العقار."
          : isEditing
            ? "Could not update the property type."
            : "Could not create the property type.",
      );
    } finally {
      setCreating(false);
      setSaving(false);
    }
  };

  const startEdit = (propertyType: PropertyTypeRow) => {
    setEditingId(propertyType.id);
    setNameEn(propertyType.name_en || propertyType.name || "");
    setNameAr(propertyType.name_ar || "");
    setNameFr(propertyType.name_fr || "");
    setSlug(propertyType.slug || "");
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
      const response = await fetch(`/api/property-types/${id}`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Status ${response.status}`);
      }

      setPropertyTypes((current) => current.filter((pt) => pt.id !== id));
      toast.success(
        locale === "ar" ? "تم حذف نوع العقار." : "Property type deleted.",
      );
    } catch (error) {
      console.error("Failed to delete property type:", error);
      const msg = error instanceof Error ? error.message : String(error);
      if (msg) {
        if (locale === "ar" && /foreign key|constraint|مفتاح/i.test(msg)) {
          toast.error("لا يمكن حذف نوع العقار لوجود عقارات مرتبطة به.");
        } else {
          toast.error(msg);
        }
      } else {
        toast.error(
          locale === "ar"
            ? "تعذر حذف نوع العقار."
            : "Could not delete property type.",
        );
      }
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
                ? "تعديل نوع العقار"
                : "Edit property type"
              : locale === "ar"
                ? "إنشاء نوع عقار جديد"
                : "Create a new property type"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="property-type-name-en">English name</Label>
              <Input
                id="property-type-name-en"
                value={nameEn}
                onChange={(event) => setNameEn(event.target.value)}
                placeholder="Apartment"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="property-type-name-ar">Arabic name</Label>
              <Input
                id="property-type-name-ar"
                value={nameAr}
                onChange={(event) => setNameAr(event.target.value)}
                placeholder="شقة"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="property-type-name-fr">French name</Label>
              <Input
                id="property-type-name-fr"
                value={nameFr}
                onChange={(event) => setNameFr(event.target.value)}
                placeholder="Appartement"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="property-type-slug">
                {locale === "ar" ? "المعرف (اختياري)" : "Slug (optional)"}
              </Label>
              <Input
                id="property-type-slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="apartment"
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
                    ? "إنشاء النوع"
                    : "Create property type"}
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
            {locale === "ar"
              ? "أنواع العقارات الحالية"
              : "Current property types"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedPropertyTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {locale === "ar"
                ? "لا توجد أنواع عقارات بعد."
                : "No property types yet."}
            </p>
          ) : (
            sortedPropertyTypes.map((propertyType) => (
              <div
                key={propertyType.id}
                className={`flex items-center justify-between rounded-2xl border border-border/70 px-4 py-3 text-sm ${editingId === propertyType.id ? "bg-muted/40 ring-1 ring-violet-500/20" : ""}`}
              >
                <div className="flex-1">
                  <div className="font-medium">
                    {propertyType[`name_${locale}`] || propertyType.name}
                  </div>
                  <div className="text-muted-foreground">
                    {propertyType.slug}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground mr-4">
                    {propertyType._count?.properties ?? 0}{" "}
                    {locale === "ar" ? "عقار" : "properties"}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(propertyType)}
                    >
                      <Edit3 className="h-4 w-4" />
                      {locale === "ar" ? "تعديل" : "Edit"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => confirmDelete(propertyType.id)}
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
                ? "هل تريد حذف نوع العقار هذا؟"
                : "Delete this property type?"}
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
