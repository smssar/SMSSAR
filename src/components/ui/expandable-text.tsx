"use client";

import { useState } from "react";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";

export default function ExpandableText({
  text,
  maxLength = 200,
  className = "text-sm leading-6 text-muted-foreground",
  locale,
}: {
  text?: string | null;
  maxLength?: number;
  className?: string;
  locale?: Locale;
}) {
  const content = text ?? "";
  const [expanded, setExpanded] = useState(false);

  const _msgs = getMessages(locale) as unknown as Record<string, unknown>;
  const common = _msgs?.common as Record<string, unknown> | undefined;
  const moreLabel = (common?.showMore as string) ?? "Show more";
  const lessLabel = (common?.showLess as string) ?? "Show less";

  if (content.length <= maxLength) {
    return <p className={className}>{content}</p>;
  }

  const truncated = content.slice(0, maxLength).trim();

  return (
    <div>
      <p className={className}>
        {expanded ? content : `${truncated.replace(/\s+$/, "")}...`}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((s) => !s)}
        className="mt-2 text-sm font-medium text-violet-600 hover:underline cursor-pointer"
      >
        {expanded ? lessLabel : moreLabel}
      </button>
    </div>
  );
}
