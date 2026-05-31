"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Edit3, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMessages } from "@/lib/messages";
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
  ads: number | null;
  adsduration: number | null;
  maxFeaturedListings: number | null;
  maxImagesPerListing: number | null;
  maxVideosPerListing: number | null;
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
  ads: string;
  adsduration: string;
  maxFeaturedListings: string;
  maxImagesPerListing: string;
  maxVideosPerListing: string;
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
  ads: "",
  adsduration: "",
  maxFeaturedListings: "",
  maxImagesPerListing: "",
  maxVideosPerListing: "",
});

export function AdminPlansPanel({
  locale,
  initialPlans,
}: {
  locale: Locale;
  initialPlans: PlanRow[];
}) {
  const messages = getMessages(locale);
  const t = messages.dashboard.admin.plansPanel;
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
      ads: plan.ads === null ? "" : String(plan.ads),
      adsduration: plan.adsduration === null ? "" : String(plan.adsduration),
      maxFeaturedListings:
        plan.maxFeaturedListings === null
          ? ""
          : String(plan.maxFeaturedListings),
      maxImagesPerListing:
        plan.maxImagesPerListing === null
          ? ""
          : String(plan.maxImagesPerListing),
      maxVideosPerListing:
        plan.maxVideosPerListing === null
          ? ""
          : String(plan.maxVideosPerListing),
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
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
      ads: form.ads.trim() === "" ? null : Number(form.ads),
      adsduration:
        form.adsduration.trim() === "" ? null : Number(form.adsduration),
      maxFeaturedListings:
        form.maxFeaturedListings.trim() === ""
          ? null
          : Number(form.maxFeaturedListings),
      maxImagesPerListing:
        form.maxImagesPerListing.trim() === ""
          ? null
          : Number(form.maxImagesPerListing),
      maxVideosPerListing:
        form.maxVideosPerListing.trim() === ""
          ? null
          : Number(form.maxVideosPerListing),
    };

    if (!payload.id || !payload.title || !payload.description) {
      toast.error(t.fillRequiredFields);
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
      toast.success(t.saveSuccess);
    } catch (error) {
      console.error("Failed to save plan:", error);
      toast.error(t.saveError);
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
      toast.success(t.deleteSuccess);
    } catch (error) {
      console.error("Failed to delete plan:", error);
      toast.error(t.deleteError);
    } finally {
      setPendingDeleteId(null);
      setDeleting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>{editingId ? t.editTitle : t.addTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="plan-id">{t.idLabel}</Label>
              <Input
                id="plan-id"
                value={form.id}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, id: e.target.value }))
                }
                disabled={Boolean(editingId)}
                placeholder={t.idPlaceholder}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan-title">{t.englishTitleLabel}</Label>
              <Input
                id="plan-title"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder={t.englishTitlePlaceholder}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan-title-ar">{t.arabicTitleLabel}</Label>
              <Input
                id="plan-title-ar"
                value={form.titleAr}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, titleAr: e.target.value }))
                }
                placeholder={t.arabicTitlePlaceholder}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan-title-fr">{t.frenchTitleLabel}</Label>
              <Input
                id="plan-title-fr"
                value={form.titleFr}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, titleFr: e.target.value }))
                }
                placeholder={t.frenchTitlePlaceholder}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan-description">
                {t.englishDescriptionLabel}
              </Label>
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
              <Label htmlFor="plan-description-ar">
                {t.arabicDescriptionLabel}
              </Label>
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
              <Label htmlFor="plan-description-fr">
                {t.frenchDescriptionLabel}
              </Label>
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
                <Label htmlFor="plan-price">{t.priceLabel}</Label>
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
                <Label htmlFor="plan-listings">{t.listingsLabel}</Label>
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

            <div className="space-y-2">
              <Label htmlFor="plan-ads">{t.adsLabel}</Label>
              <Input
                id="plan-ads"
                type="number"
                min={0}
                value={form.ads}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, ads: e.target.value }))
                }
                placeholder="0"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="plan-adsduration">{t.adsDurationLabel}</Label>
                <Input
                  id="plan-adsduration"
                  type="number"
                  min={0}
                  value={form.adsduration}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      adsduration: e.target.value,
                    }))
                  }
                  placeholder="30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-maxFeaturedListings">
                  {t.maxFeaturedListingsLabel}
                </Label>
                <Input
                  id="plan-maxFeaturedListings"
                  type="number"
                  min={0}
                  value={form.maxFeaturedListings}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      maxFeaturedListings: e.target.value,
                    }))
                  }
                  placeholder="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="plan-maxImagesPerListing">
                  {t.maxImagesPerListingLabel}
                </Label>
                <Input
                  id="plan-maxImagesPerListing"
                  type="number"
                  min={0}
                  value={form.maxImagesPerListing}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      maxImagesPerListing: e.target.value,
                    }))
                  }
                  placeholder="10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-maxVideosPerListing">
                  {t.maxVideosPerListingLabel}
                </Label>
                <Input
                  id="plan-maxVideosPerListing"
                  type="number"
                  min={0}
                  value={form.maxVideosPerListing}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      maxVideosPerListing: e.target.value,
                    }))
                  }
                  placeholder="1"
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
              <Label htmlFor="plan-featured">{t.featuredLabel}</Label>
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
              {editingId ? t.saveButton : t.createButton}
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
                {t.cancelButton}
              </Button>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>{t.currentPlansTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedPlans.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.noPlans}</p>
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
                      ? t.freeLabel
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
                    {t.editButton}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => confirmDelete(plan.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t.deleteButton}
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
              {t.confirmDeleteTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t.confirmDeleteBody}
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
                {t.cancelButton}
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
                {t.deleteButton}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
