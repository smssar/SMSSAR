"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";

export default function CreateAdPageClient({ locale }: { locale?: string }) {
  const params = useParams() as { id?: string; locale?: string };
  const propertyId = params.id;
  const router = useRouter();
  const localeUsed = locale ?? params.locale ?? "en";
  const messages = getMessages(localeUsed as Locale);
  const t = messages.dashboard.seller.adsPage;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [adsDuration, setAdsDuration] = useState<number | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch("/api/users/me/plan");
        if (res.ok) {
          const data = await res.json();
          setAdsDuration(data.plan?.adsduration ?? null);
        }
      } catch (err) {
        console.error("Failed to fetch plan:", err);
      }
    };
    fetchPlan();
  }, []);

  const endAt = useMemo(() => {
    if (startAt && adsDuration) {
      const start = new Date(startAt);
      const end = new Date(start.getTime() + adsDuration * 24 * 60 * 60 * 1000);
      return end.toISOString().slice(0, 16);
    }
    return "";
  }, [startAt, adsDuration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId) return toast.error(t.missingProperty);
    setLoading(true);
    try {
      const res = await fetch(`/api/ads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: localeUsed,
          propertyId,
          title,
          description,
          startAt,
          endAt,
        }),
      });
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.error || t.error);
      }
      toast.success(t.success);
      router.replace(`/${localeUsed}/dashboard/seller/listings`);
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">{t.title}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t.subtitle}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>{t.adTitleLabel}</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder={t.adTitlePlaceholder}
          />
        </div>

        <div>
          <Label>{t.descriptionLabel}</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.descriptionPlaceholder}
          />
        </div>

        <div>
          <Label>{t.startAtLabel}</Label>
          <Input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            required
          />
        </div>

        <div>
          <Label>
            {t.endAtLabel}
            {adsDuration && (
              <span className="ml-2 text-xs text-muted-foreground">
                ({adsDuration} days)
              </span>
            )}
          </Label>
          <Input
            type="datetime-local"
            value={endAt}
            readOnly
            className="bg-muted/50 cursor-not-allowed"
            disabled
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? t.savingButton : t.submitButton}
        </Button>
      </form>
    </div>
  );
}
