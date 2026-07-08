"use client";

import { Globe, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { locales, type Locale } from "@/lib/locales";

function buildLocalizedPath(pathname: string, nextLocale: Locale) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return `/${nextLocale}`;
  }

  if (locales.includes(segments[0] as Locale)) {
    segments[0] = nextLocale;
    return `/${segments.join("/")}`;
  }

  return `/${nextLocale}/${segments.join("/")}`;
}

const languageOptions: Record<
  Locale,
  {
    label: string;
    flag: string;
  }
> = {
  en: {
    label: "English",
    flag: "🇺🇸",
  },
  fr: {
    label: "Français",
    flag: "🇫🇷",
  },
  ar: {
    label: "العربية",
    flag: "🇲🇦",
  },
};

export function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const switchLocale = (locale: Locale) => {
    localStorage.setItem("locale", locale);
    setOpen(false);
    router.replace(buildLocalizedPath(pathname, locale));
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-11 min-w-45 items-center justify-between rounded-full border bg-white px-4 shadow-sm transition hover:bg-gray-50"
      >
        <div className="flex items-center gap-2 cursor-pointer">
          <Globe className="h-4 w-4 text-gray-500" />

          <span className="text-lg">{languageOptions[currentLocale].flag}</span>

          <span className="font-medium">
            {languageOptions[currentLocale].label}
          </span>
        </div>

        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-full overflow-hidden rounded-2xl border bg-white shadow-xl">
          {locales.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => switchLocale(locale)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-100 cursor-pointer ${
                locale === currentLocale ? "bg-gray-50 font-semibold" : ""
              }`}
            >
              <span className="text-lg">{languageOptions[locale].flag}</span>

              <span>{languageOptions[locale].label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
