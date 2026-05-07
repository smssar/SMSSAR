import type { Locale } from "@/lib/locales";
import { formatCompactNumber } from "@/lib/format";
import type { ReactNode } from "react";

export function StatGrid({
  locale,
  items,
}: {
  locale: Locale;
  items: { label: string; value: number; icon?: ReactNode }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => (
        <div
          key={`${item.label || "stat"}-${index}`}
          className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm"
        >
          <div className="flex items-center justify-center lg:justify-start gap-3 text-sm text-muted-foreground ">
            {item.icon}
            <span>{item.label}</span>
          </div>
          <div className="mt-3 text-3xl font-semibold tracking-tight">
            {formatCompactNumber(item.value, locale)}
          </div>
        </div>
      ))}
    </div>
  );
}
