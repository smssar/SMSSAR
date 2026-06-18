"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "theme";

function setTheme(theme: "light" | "dark") {
  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  localStorage.setItem(STORAGE_KEY, theme);
}

export function ThemeToggle({
  initialLocale,
}: {
  initialLocale: "en" | "ar" | "fr";
}) {
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as
      | "light"
      | "dark"
      | null;
    const preferred =
      stored ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    setTheme(preferred);
  }, []);

  const toggleTheme = () => {
    const nextTheme = document.documentElement.classList.contains("dark")
      ? "light"
      : "dark";
    setTheme(nextTheme);
  };

  return (
    <div className={"fixed bottom-10 left-5 z-50 flex"}>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="border shadow-xl cursor-pointer p-6"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        title="Toggle light/dark mode"
      >
        <SunMedium className=" h-8 w-8 dark:hidden" />
        <MoonStar className="hidden h-8 w-8 dark:block" />
      </Button>
    </div>
  );
}
