export const locales = ["en", "ar", "fr"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

export const getLocaleFromAcceptLanguage = (
  acceptLanguage?: string | null,
): Locale => {
  const preferred = acceptLanguage
    ?.split(",")
    .map((segment) => segment.trim().slice(0, 2))
    .find((segment) => (locales as readonly string[]).includes(segment));
  console.log("Preferred locale from Accept-Language:", preferred);
  return (preferred as Locale | undefined) ?? defaultLocale;
};

export const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

export const getDirection = (locale: Locale) =>
  locale === "ar" ? "rtl" : "ltr";

export const localizePath = (locale: Locale, path = "") => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalized === "/" ? "" : normalized}`;
};
