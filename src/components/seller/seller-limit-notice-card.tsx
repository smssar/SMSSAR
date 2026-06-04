"use client";

import { useState } from "react";
import { BellRing, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export function SellerLimitNoticeCard({
  title,
  description,
  locale,
}: {
  title: string;
  description: string;
  locale?: string;
}) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const lang = locale ?? "en";

  const labels: Record<string, { upgrade: string; addons: string }> = {
    en: { upgrade: "Upgrade plan", addons: "Buy add-ons" },
    ar: { upgrade: "ترقية الخطة", addons: "شراء الإضافات" },
    fr: { upgrade: "Mettre à niveau", addons: "Acheter des add-ons" },
  };

  const { upgrade, addons } = labels[lang] ?? labels.en;

  return (
    <Card className="border-amber-300 bg-amber-50">
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <BellRing className="h-5 w-5 text-amber-600" />
          <div>
            <div className="font-medium text-amber-900">{title}</div>
            <div className="text-sm text-muted-foreground">{description}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ButtonLink
            href={`/${lang}/pricing`}
            variant="accent"
            size="sm"
            className="rounded-full"
          >
            {upgrade}
          </ButtonLink>
          <ButtonLink
            href={`/${lang}/dashboard/seller/purchases`}
            variant="outline"
            size="sm"
            className="rounded-full"
          >
            {addons}
          </ButtonLink>

          <X
            onClick={() => setVisible(false)}
            className="hover:scale-120 cursor-pointer"
            role="button"
            aria-label="close"
          />
        </div>
      </CardContent>
    </Card>
  );
}
