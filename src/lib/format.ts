import type { Locale } from "@/lib/locales";

function toIntlLocale(locale: Locale | string) {
  return locale === "ar" ? "ar-MA" : "en-MA";
}

export function formatCurrency(value: number, locale: Locale) {
  const formattedNumber = new Intl.NumberFormat(toIntlLocale(locale), {
    maximumFractionDigits: 0,
  }).format(value);

  return `${formattedNumber} DH`;
}

export function formatCompactNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(toIntlLocale(locale), {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(toIntlLocale(locale)).format(value);
}

export function slugify(text: string) {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^a-z0-9-]/g, "") // Remove all non-alphanumeric chars except -
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start
    .replace(/-+$/, ""); // Trim - from end
}
