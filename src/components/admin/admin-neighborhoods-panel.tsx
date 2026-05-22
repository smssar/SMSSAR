"use client";

import { useMemo, useState } from "react";
import { Edit3, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Locale } from "@/lib/locales";

type LocalizedCity = {
  id: string;
  name: string;
  name_en?: string | null;
  name_ar?: string | null;
  name_fr?: string | null;
};

type NeighborhoodRow = {
  id: string;
  name: string;
  name_en?: string | null;
  name_ar?: string | null;
  name_fr?: string | null;
  slug: string | null;
  cityId: string;
  city: LocalizedCity;
  propertyCount?: number;
};

function getLocalizedLabel(
  locale: Locale,
  item: { name: string; name_ar?: string | null; name_fr?: string | null },
) {
  if (locale === "ar") return item.name_ar || item.name;
  if (locale === "fr") return item.name_fr || item.name;
  return item.name;
}

export function AdminNeighborhoodsPanel({
  locale,
  initialCities,
  initialNeighborhoods,
}: {
  locale: Locale;
  initialCities: LocalizedCity[];
  initialNeighborhoods: NeighborhoodRow[];
}) {
  const [cities] = useState(initialCities);
  const [neighborhoods, setNeighborhoods] = useState(initialNeighborhoods);
  const [cityId, setCityId] = useState(initialCities[0]?.id ?? "");
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [slug, setSlug] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const sortedNeighborhoods = useMemo(
    () =>
      [...neighborhoods].sort((a, b) => {
        const cityName = a.city.name.localeCompare(b.city.name);
        if (cityName !== 0) return cityName;
        return a.name.localeCompare(b.name);
      }),
    [neighborhoods],
  );
  const [neighborhoodQuery, setNeighborhoodQuery] = useState("");

  const filteredNeighborhoods = useMemo(() => {
    const q = neighborhoodQuery.trim().toLowerCase();
    if (!q) return sortedNeighborhoods;
    return sortedNeighborhoods.filter((n) => {
      const names = [
        n.name || "",
        n.name_en || "",
        n.name_ar || "",
        n.name_fr || "",
      ]
        .join(" ")
        .toLowerCase();
      const cityNames = [
        n.city.name || "",
        n.city.name_en || "",
        n.city.name_ar || "",
        n.city.name_fr || "",
      ]
        .join(" ")
        .toLowerCase();
      return (
        names.includes(q) ||
        cityNames.includes(q) ||
        (n.slug || "").toLowerCase().includes(q)
      );
    });
  }, [sortedNeighborhoods, neighborhoodQuery]);

  const resetForm = () => {
    setEditingId(null);
    setCityId(cities[0]?.id ?? "");
    setNameEn("");
    setNameAr("");
    setNameFr("");
    setSlug("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanedNameEn = nameEn.trim();
    const cleanedNameAr = nameAr.trim();
    const cleanedNameFr = nameFr.trim();
    const cleanedSlug = slug.trim();

    if (!cleanedNameEn) {
      toast.error(
        locale === "ar"
          ? "اسم الحي بالإنجليزية مطلوب."
          : "English neighborhood name is required.",
      );
      return;
    }

    if (!editingId && !cityId) {
      toast.error(
        locale === "ar" ? "يرجى اختيار مدينة." : "Please select a city.",
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
        editingId ? `/api/neighborhoods/${editingId}` : "/api/neighborhoods",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cityId: editingId ? undefined : cityId,
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

      const savedNeighborhood = payload?.data as NeighborhoodRow | undefined;
      if (savedNeighborhood) {
        setNeighborhoods((current) =>
          editingId
            ? current.map((item) =>
                item.id === savedNeighborhood.id ? savedNeighborhood : item,
              )
            : [savedNeighborhood, ...current],
        );
      }

      resetForm();
      toast.success(
        locale === "ar"
          ? editingId
            ? "تم تحديث الحي."
            : "تم إنشاء الحي."
          : editingId
            ? "Neighborhood updated."
            : "Neighborhood created.",
      );
    } catch (error) {
      console.error(
        editingId
          ? "Failed to update neighborhood:"
          : "Failed to create neighborhood:",
        error,
      );
      toast.error(
        locale === "ar"
          ? editingId
            ? "تعذر تحديث الحي."
            : "تعذر إنشاء الحي."
          : editingId
            ? "Could not update neighborhood."
            : "Could not create neighborhood.",
      );
    } finally {
      setCreating(false);
      setSaving(false);
    }
  };

  const startEdit = (neighborhood: NeighborhoodRow) => {
    setEditingId(neighborhood.id);
    setCityId(neighborhood.cityId);
    setNameEn(neighborhood.name_en || neighborhood.name || "");
    setNameAr(neighborhood.name_ar || "");
    setNameFr(neighborhood.name_fr || "");
    setSlug(neighborhood.slug || "");
  };

  const CANCELLEDit = () => {
    resetForm();
  };

  const performDelete = async (id: string) => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/neighborhoods/${id}`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Status ${response.status}`);
      }

      setNeighborhoods((current) => current.filter((item) => item.id !== id));
      toast.success(locale === "ar" ? "تم حذف الحي." : "Neighborhood deleted.");
    } catch (error) {
      console.error("Failed to delete neighborhood:", error);
      toast.error(
        locale === "ar" ? "تعذر حذف الحي." : "Could not delete neighborhood.",
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
                ? "تعديل الحي"
                : "Edit neighborhood"
              : locale === "ar"
                ? "إضافة حي"
                : "Add a neighborhood"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="neighborhood-city">
                {locale === "ar" ? "المدينة" : "City"}
              </Label>
              <Select
                id="neighborhood-city"
                value={cityId}
                onChange={(event) => setCityId(event.target.value)}
                disabled={Boolean(editingId)}
                required
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {getLocalizedLabel(locale, city)}
                  </option>
                ))}
              </Select>
              {editingId ? (
                <p className="text-xs text-muted-foreground">
                  {locale === "ar"
                    ? "لا يمكن تغيير المدينة أثناء التعديل."
                    : "City cannot be changed while editing."}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood-name-en">English name</Label>
              <Input
                id="neighborhood-name-en"
                value={nameEn}
                onChange={(event) => setNameEn(event.target.value)}
                placeholder="Al Jimi"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood-name-ar">Arabic name</Label>
              <Input
                id="neighborhood-name-ar"
                value={nameAr}
                onChange={(event) => setNameAr(event.target.value)}
                placeholder="الجيمي"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood-name-fr">French name</Label>
              <Input
                id="neighborhood-name-fr"
                value={nameFr}
                onChange={(event) => setNameFr(event.target.value)}
                placeholder="Al Jimi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood-slug">
                {locale === "ar" ? "المعرف (اختياري)" : "Slug (optional)"}
              </Label>
              <Input
                id="neighborhood-slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder={locale === "ar" ? "al-jimi" : "al-jimi"}
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
                    ? "إضافة الحي"
                    : "Add neighborhood"}
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
            {locale === "ar" ? "الأحياء الحالية" : "Current neighborhoods"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="mb-3">
            <Input
              placeholder={
                locale === "ar" ? "ابحث في الأحياء" : "Search neighborhoods"
              }
              value={neighborhoodQuery}
              onChange={(e) => setNeighborhoodQuery(e.target.value)}
            />
          </div>
          {filteredNeighborhoods.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
              {locale === "ar"
                ? "لا توجد أحياء متطابقة."
                : "No matching neighborhoods."}
            </div>
          ) : (
            filteredNeighborhoods.map((neighborhood) => (
              <div
                key={neighborhood.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-medium">
                    {getLocalizedLabel(locale, neighborhood)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getLocalizedLabel(locale, neighborhood.city)}
                    {neighborhood.propertyCount !== undefined
                      ? ` • ${neighborhood.propertyCount} ${locale === "ar" ? "عقار" : "properties"}`
                      : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => startEdit(neighborhood)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => setPendingDeleteId(neighborhood.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {pendingDeleteId ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-background p-6 shadow-xl">
            <h3 className="text-lg font-semibold">
              {locale === "ar" ? "تأكيد الحذف" : "Confirm delete"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {locale === "ar"
                ? "هل تريد حذف هذا الحي؟"
                : "Do you want to delete this neighborhood?"}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setPendingDeleteId(null)}
                disabled={deleting}
              >
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                variant="accent"
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={() => void performDelete(pendingDeleteId)}
                disabled={deleting}
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
