import React from "react";
import type { Locale } from "@/lib/locales";

/**
 * Page model content fields that support localization.
 * Each field has a base English name (e.g. `title`) and optional `_ar`, `_fr` variants.
 *
 * Until the DB schema is updated with actual columns for `title_ar`, `title_fr`, etc.,
 * the `_ar`/`_fr` values passed via the admin UI will be stored in the single column
 * as a JSON string: `{"en":"...","ar":"...","fr":"..."}`.
 *
 * This helper reads the field and returns the localized string based on the locale.
 */

/**
 * Given a page object and a field name, return the localized version
 * of that field for the given locale.
 *
 * If the field value is a JSON-encoded object with `en`, `ar`, `fr` keys,
 * it deserializes and returns the appropriate locale value.
 * Otherwise it falls back to the plain string value.
 */
export function getLocalizedField(
  page: Record<string, unknown>,
  fieldName: string,
  locale: Locale,
): string | null | undefined {
  const value = page[fieldName];

  // If null or undefined, return as-is
  if (value === null || value === undefined) return value;

  // If it's already a string, check if it's a JSON-encoded locale object
  if (typeof value === "string") {
    const trimmed = value.trim();
    // Only attempt JSON.parse if it looks like an object to reduce false positives
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(value) as Record<string, unknown>;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const localized = parsed[locale as string] as unknown;
          if (localized !== undefined && localized !== null)
            return String(localized);
          if (parsed.en !== undefined && parsed.en !== null)
            return String(parsed.en);
          return value;
        }
      } catch {
        // Not JSON — fall through to return plain string
      }
    }
    // Plain string — return as-is (assumed English)
    return value;
  }

  return String(value);
}

/**
 * Get localized value directly from a set of locale-specific fields.
 * Standard pattern: field = "title", then look for `title_ar`, `title_fr`.
 */
export function getLocalizedFromSuffixed(
  item: Record<string, unknown>,
  fieldBase: string,
  locale: Locale,
): string | null | undefined {
  if (locale === "ar") {
    return (item[`${fieldBase}_ar`] as string) ?? (item[fieldBase] as string);
  }
  if (locale === "fr") {
    return (item[`${fieldBase}_fr`] as string) ?? (item[fieldBase] as string);
  }
  return item[fieldBase] as string;
}

/**
 * React component that renders a localized field from a page object.
 * Uses the JSON-embedded approach to support multilingual content
 * without requiring schema changes.
 */
export function LocalizedPageField({
  page,
  field,
  locale,
  fallback,
}: {
  page: Record<string, unknown>;
  field: string;
  locale: Locale;
  fallback?: string;
}): React.ReactNode | null {
  const value = getLocalizedField(page, field, locale);
  if (value === null || value === undefined) {
    return <>{fallback ?? ""}</>;
  }
  return <>{value}</>;
}
