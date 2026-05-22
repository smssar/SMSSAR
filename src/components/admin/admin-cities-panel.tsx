/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { Edit3, Loader2, MapPinned, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/locales";

type CityRow = {
  id: string;
  name: string;
  name_en?: string | null;
  name_ar?: string | null;
  name_fr?: string | null;
  slug: string | null;
  propertyCount?: number;
};

export function AdminCitiesPanel({
  locale,
  initialCities,
}: {
  locale: Locale;
  initialCities: CityRow[];
}) {
  const [cities, setCities] = useState(initialCities);
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [slug, setSlug] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const sortedCities = useMemo(
    () =>
      [...cities].sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [cities],
  );
  const [cityQuery, setCityQuery] = useState("");

  const filteredCities = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return sortedCities;
    return sortedCities.filter((c) => {
      const names = [
        c.name || "",
        c.name_en || "",
        c.name_ar || "",
        c.name_fr || "",
      ]
        .join(" ")
        .toLowerCase();
      return names.includes(q) || (c.slug || "").toLowerCase().includes(q);
    });
  }, [sortedCities, cityQuery]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanedNameEn = nameEn.trim();
    const cleanedNameAr = nameAr.trim();
    const cleanedNameFr = nameFr.trim();
    const cleanedSlug = slug.trim();

    if (!cleanedNameEn) {
      toast.error(
        locale === "ar"
          ? "اسم المدينة بالإنجليزية مطلوب."
          : "English city name is required.",
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
        editingId ? `/api/cities/${editingId}` : "/api/cities",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name_en: cleanedNameEn,
            name_ar: cleanedNameAr || undefined,
            name_fr: cleanedNameFr || undefined,
            slug: cleanedSlug || undefined,
          }),
        },
      );

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Status ${response.status}`);
      }

      const savedCity = payload?.data as CityRow | undefined;
      if (savedCity) {
        setCities((current) =>
          editingId
            ? current.map((city) =>
                city.id === savedCity.id ? savedCity : city,
              )
            : [savedCity, ...current],
        );
      }

      setNameEn("");
      setNameAr("");
      setNameFr("");
      setSlug("");

      if (isEditing) {
        setEditingId(null);
        toast.success(locale === "ar" ? "تم تحديث المدينة." : "City updated.");
      } else {
        toast.success(locale === "ar" ? "تم إنشاء المدينة." : "City created.");
      }
    } catch (error) {
      console.error(
        isEditing ? "Failed to update city:" : "Failed to create city:",
        error,
      );
      toast.error(
        locale === "ar"
          ? isEditing
            ? "تعذر تحديث المدينة."
            : "تعذر إنشاء المدينة."
          : isEditing
            ? "Could not update city."
            : "Could not create city.",
      );
    } finally {
      setCreating(false);
      setSaving(false);
    }
  };

  const startEdit = (city: CityRow) => {
    setEditingId(city.id);
    setNameEn(city.name_en || city.name || "");
    setNameAr(city.name_ar || "");
    setNameFr(city.name_fr || "");
    setSlug(city.slug || "");
  };

  const CANCELLEDit = () => {
    setEditingId(null);
    setNameEn("");
    setNameAr("");
    setNameFr("");
    setSlug("");
  };

  const performDelete = async (id: string) => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/cities/${id}`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Status ${response.status}`);
      }

      setCities((current) => current.filter((c) => c.id !== id));
      toast.success(locale === "ar" ? "تم حذف المدينة." : "City deleted.");
    } catch (error) {
      console.error("Failed to delete city:", error);
      toast.error(
        locale === "ar" ? "تعذر حذف المدينة." : "Could not delete city.",
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
                ? "تعديل المدينة"
                : "Edit city"
              : locale === "ar"
                ? "إضافة مدينة"
                : "Add a city"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="city-name-en">English name</Label>
              <Input
                id="city-name-en"
                value={nameEn}
                onChange={(event) => setNameEn(event.target.value)}
                placeholder="Dubai"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city-name-ar">Arabic name</Label>
              <Input
                id="city-name-ar"
                value={nameAr}
                onChange={(event) => setNameAr(event.target.value)}
                placeholder="دبي"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city-name-fr">French name</Label>
              <Input
                id="city-name-fr"
                value={nameFr}
                onChange={(event) => setNameFr(event.target.value)}
                placeholder="Dubaï"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city-slug">
                {locale === "ar" ? "المعرف (اختياري)" : "Slug (optional)"}
              </Label>
              <Input
                id="city-slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder={locale === "ar" ? "dubai" : "dubai"}
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
                    ? "إضافة المدينة"
                    : "Add city"}
              </Button>

              {editingId ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={CANCELLEDit}
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
            {locale === "ar" ? "المدن الحالية" : "Current cities"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="mb-3">
            <Input
              placeholder={locale === "ar" ? "ابحث في المدن" : "Search cities"}
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
            />
          </div>
          {filteredCities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {locale === "ar" ? "لا توجد مدن متطابقة." : "No matching cities."}
            </p>
          ) : (
            filteredCities.map((city) => (
              <div
                key={city.id}
                className={`flex items-center justify-between rounded-2xl border border-border/70 px-4 py-3 text-sm ${editingId === city.id ? "bg-muted/40 ring-1 ring-violet-500/20" : ""}`}
              >
                <div className="flex-1">
                  <div className="font-medium">
                    {(city as any)[`name_${locale}`] || city.name}
                  </div>
                  <div className="text-muted-foreground">{city.slug}</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="mr-4 text-muted-foreground">
                    {city.propertyCount ?? 0}{" "}
                    {locale === "ar" ? "عقار" : "properties"}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(city)}
                    >
                      <Edit3 className="h-4 w-4" />
                      {locale === "ar" ? "تعديل" : "Edit"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPendingDeleteId(city.id)}
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
              <MapPinned className="h-6 w-6" />
            </div>

            <h2 className="text-2xl font-semibold tracking-tight">
              {locale === "ar" ? "تأكيد الحذف" : "Confirm delete"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {locale === "ar"
                ? "هل تريد حذف هذه المدينة؟"
                : "Delete this city?"}
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
                className="bg-red-600 text-white hover:bg-red-700"
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
