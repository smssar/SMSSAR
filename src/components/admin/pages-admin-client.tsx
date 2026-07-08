/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useMemo, useState } from "react";
import type { Messages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";
import ReactSelect from "react-select";
import { slugify } from "@/lib/format";
import type { PageModel } from "@/generated/prisma/models/Page";
import {
  Search,
  Check,
  X,
  Trash2,
  FileText,
  FileEdit,
  Plus,
  ChevronLeft,
  Loader2,
  Save,
  Globe,
  Settings2,
  List,
} from "lucide-react";
const reactSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    minHeight: 40,
    borderRadius: 12,
    borderColor: state.isFocused
      ? "rgba(124, 58, 237, 0.5)"
      : "rgba(148, 163, 184, 0.7)",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(124, 58, 237, 0.15)" : "none",
    transition: "border-color 150ms ease, box-shadow 150ms ease",
    backgroundColor: "var(--background)",
    cursor: "pointer",
    fontSize: 14,
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: 12,
    boxShadow: "0 10px 40px rgba(15, 23, 42, 0.15)",
    overflow: "hidden",
    zIndex: 9999,
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused
      ? "rgba(124, 58, 237, 0.08)"
      : state.isSelected
        ? "rgba(124, 58, 237, 0.12)"
        : "transparent",
    color: "#1f2937",
    cursor: "pointer",
    fontSize: 14,
  }),
  placeholder: (base: any) => ({
    ...base,
    color: "#1f2937",
    fontSize: 14,
  }),
  multiValue: (base: any) => ({
    ...base,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    borderRadius: 8,
  }),
  multiValueLabel: (base: any) => ({
    ...base,
    color: "dark:#FFFF",
    fontSize: 14,
  }),
  multiValueRemove: (base: any) => ({
    ...base,
    color: "rgba(124, 58, 237, 0.6)",
    cursor: "pointer",
    ":hover": {
      backgroundColor: "rgba(124, 58, 237, 0.2)",
      color: "rgb(124, 58, 237)",
    },
  }),
  input: (base: any) => ({
    ...base,
    color: "#1f2937",
  }),
  noOptionsMessage: (base: any) => ({
    ...base,
    fontSize: 14,
  }),
};

type Option = { value: string; label: string };

function MultiSelect({
  label,
  options,
  selected,
  onSelect,
  optionLabels,
}: {
  label: string;
  options: string[];
  selected: string[];
  onSelect: (vals: string[]) => void;
  optionLabels?: Record<string, string>;
}) {
  const selectOptions: Option[] = useMemo(
    () =>
      options.map((opt) => ({
        value: opt,
        label: optionLabels?.[opt] ?? opt,
      })),
    [options, optionLabels],
  );

  const selectedValues: Option[] = useMemo(
    () => selectOptions.filter((o) => selected.includes(o.value)),
    [selectOptions, selected],
  );

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <ReactSelect
        isMulti
        options={selectOptions}
        value={selectedValues}
        onChange={(newValue) => {
          onSelect((newValue as Option[]).map((v) => v.value));
        }}
        placeholder="Select..."
        noOptionsMessage={() => "No options"}
        styles={reactSelectStyles}
        isSearchable
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        className="react-select-container"
        classNamePrefix="react-select"
        menuPlacement="auto"
        menuPortalTarget={
          typeof document !== "undefined" ? document.body : undefined
        }
      />
    </div>
  );
}

type EditingPage = {
  id?: string;
  title?: string | null;
  title_ar?: string | null;
  title_fr?: string | null;
  slug?: string | null;
  subtitle?: string | null;
  subtitle_ar?: string | null;
  subtitle_fr?: string | null;
  heroText?: string | null;
  heroText_ar?: string | null;
  heroText_fr?: string | null;
  description?: string | null;
  description_ar?: string | null;
  description_fr?: string | null;
  article?: string | null;
  article_ar?: string | null;
  article_fr?: string | null;
  seoTitle?: string | null;
  seoTitle_ar?: string | null;
  seoTitle_fr?: string | null;
  seoDescription?: string | null;
  seoDescription_ar?: string | null;
  seoDescription_fr?: string | null;
  seoKeywords?: string[] | null;
  ogImage?: string | null;
  published?: boolean | null;
  noIndex?: boolean | null;
  prioritiesCityIds?: string[];
  propertiesNeighborhoods?: string[];
  prioritiesPropertyTypeIds?: string[];
  prioritiesForSale?: boolean | null;
  prioritiesFeatured?: boolean | null;
  prioritiesMinPrice?: number | null;
  prioritiesMaxPrice?: number | null;
  prioritiesMinArea?: number | null;
  prioritiesMaxArea?: number | null;
  prioritiesMinRooms?: number | null;
  prioritiesMaxRooms?: number | null;
  prioritiesMinBathrooms?: number | null;
  prioritiesMaxBathrooms?: number | null;
  prioritiesPriceType?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

type LangTab = "en" | "ar" | "fr";

function LocalizedInput({
  label,
  required,
  placeholder,
  langTab,
  enValue,
  arValue,
  frValue,
  onEnChange,
  onArChange,
  onFrChange,
  type,
  rows,
}: {
  label: string;
  required?: boolean;
  placeholder?: string;
  langTab: LangTab;
  enValue: string;
  arValue?: string;
  frValue?: string;
  onEnChange: (v: string) => void;
  onArChange?: (v: string) => void;
  onFrChange?: (v: string) => void;
  type?: "text" | "textarea";
  rows?: number;
}) {
  const inputClass =
    "w-full rounded-xl border border-border/70 bg-background/80 px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20";
  const textareaClass = `${inputClass} resize-y min-h-[80px]`;

  const showAr = langTab === "ar" && onArChange;
  const showFr = langTab === "fr" && onFrChange;

  return (
    <div className="space-y-1">
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
        {langTab !== "en" && (
          <span className="ml-1.5 text-[10px] uppercase text-violet-500">
            ({langTab === "ar" ? "عربي" : "Français"})
          </span>
        )}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      {type === "textarea" ? (
        <textarea
          className={textareaClass}
          placeholder={placeholder || ""}
          rows={rows || 3}
          value={showAr ? arValue || "" : showFr ? frValue || "" : enValue}
          onChange={(e) => {
            if (showAr && onArChange) onArChange(e.target.value);
            else if (showFr && onFrChange) onFrChange(e.target.value);
            else onEnChange(e.target.value);
          }}
          dir={langTab === "ar" ? "rtl" : "ltr"}
        />
      ) : (
        <input
          className={inputClass}
          placeholder={placeholder || ""}
          value={showAr ? arValue || "" : showFr ? frValue || "" : enValue}
          onChange={(e) => {
            const val = e.target.value;
            if (showAr && onArChange) onArChange(val);
            else if (showFr && onFrChange) onFrChange(val);
            else onEnChange(val);
          }}
          dir={langTab === "ar" ? "rtl" : "ltr"}
        />
      )}
    </div>
  );
}

function parseSeoKeywords(value: string) {
  return value
    .split(/[,\n]/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

function SeoKeywordsInput({
  label,
  value,
  onChange,
  locale,
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  locale: Locale;
}) {
  const [input, setInput] = useState("");

  const commitInput = (raw: string) => {
    const nextKeywords = parseSeoKeywords(raw);
    if (!nextKeywords.length) return;

    const merged = Array.from(
      new Set([...value, ...nextKeywords.map((keyword) => keyword.trim())]),
    ).filter(Boolean);
    onChange(merged);
    setInput("");
  };

  const removeKeyword = (keyword: string) => {
    onChange(value.filter((item) => item !== keyword));
  };

  return (
    <div className="space-y-2">
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>

      <div className="rounded-2xl border border-border/70 bg-background/90 p-3 shadow-sm transition focus-within:border-violet-500/60 focus-within:ring-2 focus-within:ring-violet-500/10 dark:bg-slate-950/40">
        <div className="flex flex-wrap gap-2">
          {value.map((keyword) => (
            <span
              key={keyword}
              className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200"
            >
              <span>{keyword}</span>
              <button
                type="button"
                onClick={() => removeKeyword(keyword)}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-violet-500 transition hover:bg-violet-500/15 hover:text-violet-700 dark:text-violet-200 dark:hover:bg-violet-400/15"
                aria-label={`Remove ${keyword}`}
              >
                ×
              </button>
            </span>
          ))}

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                commitInput(input);
              }
              if (e.key === "Backspace" && !input && value.length) {
                onChange(value.slice(0, -1));
              }
            }}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData("text");
              if (/[\n,]/.test(pasted)) {
                e.preventDefault();
                commitInput(`${input}${pasted}`);
              }
            }}
            onBlur={() => {
              if (input.trim()) commitInput(input);
            }}
            placeholder={
              value.length
                ? locale === "ar"
                  ? "اكتب ثم اضغط Enter"
                  : locale === "fr"
                    ? "Tapez puis appuyez sur Entrée"
                    : "Type and press Enter"
                : locale === "ar"
                  ? "أضف كلمة مفتاحية"
                  : locale === "fr"
                    ? "Ajouter un mot-clé"
                    : "Add a keyword"
            }
            className="min-w-45 flex-1 border-0 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted-foreground/60"
            dir={locale === "ar" ? "rtl" : "ltr"}
          />
        </div>

        <p className="mt-2 text-[11px] text-muted-foreground">
          {locale === "ar"
            ? "اضغط Enter لإضافة الكلمة المفتاحية."
            : locale === "fr"
              ? "Appuyez sur Entrée pour ajouter un mot-clé."
              : "Press Enter to add a keyword."}
        </p>
      </div>
    </div>
  );
}

function normalizeSeoKeywords(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((keyword) => String(keyword).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return parseSeoKeywords(value);
  }

  return [];
}

function LangSwitcher({
  langTab,
  onChange,
}: {
  langTab: LangTab;
  onChange: (tab: LangTab) => void;
}) {
  const tabs: { key: LangTab; label: string; flag: string }[] = [
    { key: "en", label: "EN", flag: "🇬🇧" },
    { key: "ar", label: "AR", flag: "🇸🇦" },
    { key: "fr", label: "FR", flag: "🇫🇷" },
  ];
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-muted/20 p-0.5">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={`cursor-pointer flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            langTab === t.key
              ? "bg-violet-600 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          }`}
        >
          <span className="text-xs">{t.flag}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

export function PagesAdminClient({
  initialPages,
  cities,
  neighborhoods,
  propertyTypes,
  messages,
  locale,
}: {
  initialPages: PageModel[];
  cities: Array<{ id: string; name: string }>;
  neighborhoods: Array<{
    id: string;
    name: string;
    cityId: string;
    cityName: string;
  }>;
  propertyTypes: Array<{ id: string; name: string }>;
  messages?: Messages;
  locale?: Locale;
}) {
  const [pages, setPages] = useState<PageModel[]>(initialPages || []);
  const [tab, setTab] = useState<"list" | "editor">("list");
  const [query, setQuery] = useState<string>("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<EditingPage | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [langTab, setLangTab] = useState<LangTab>("en");
  const currentLocale: Locale = locale ?? "en";

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter(
      (p) =>
        (p.title || "").toLowerCase().includes(q) ||
        (p.title_ar || "").toLowerCase().includes(q) ||
        (p.title_fr || "").toLowerCase().includes(q) ||
        (p.slug || "").toLowerCase().includes(q),
    );
  }, [pages, query]);

  useEffect(() => {
    const id = setTimeout(() => setSelected({}), 0);
    return () => clearTimeout(id);
  }, [pages]);

  // Compute available neighborhoods based on selected cities (memoized)
  const availableNeighborhoods = useMemo(() => {
    const selectedCities = editing?.prioritiesCityIds || [];
    if (selectedCities.length === 0) {
      return neighborhoods.map((n) => n.id);
    }
    return neighborhoods
      .filter((n) => selectedCities.includes(n.cityId))
      .map((n) => n.id);
  }, [neighborhoods, editing?.prioritiesCityIds]);

  // Handler for city selection that also cleans up invalid neighborhoods
  const handleCitySelect = (vals: string[]) => {
    if (!editing) return;
    const validNeighborhoods = new Set(
      neighborhoods.filter((n) => vals.includes(n.cityId)).map((n) => n.id),
    );
    const cleanedNeighborhoods = (editing.propertiesNeighborhoods || []).filter(
      (n) => validNeighborhoods.has(n),
    );
    setEditing({
      ...editing,
      prioritiesCityIds: vals,
      propertiesNeighborhoods: cleanedNeighborhoods,
    });
  };

  async function deletePage(id: string) {
    const res = await fetch(`/api/admin/pages/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPages((s) => s.filter((p) => p.id !== id));
      showToast(
        "success",
        t("adminPages.editor.deleteSuccess", "Page deleted."),
      );
    } else {
      showToast("error", "Delete failed");
    }
    setDeleteConfirmId(null);
  }

  async function bulkDelete() {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (!ids.length) return;
    const res = await fetch(`/api/admin/pages/bulk-delete`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (res.ok) {
      setPages((s) => s.filter((p) => !ids.includes(p.id)));
      showToast("success", `Deleted ${ids.length} pages.`);
    } else {
      showToast("error", "Bulk delete failed");
    }
    setBulkDeleteConfirm(false);
  }

  function openNew() {
    setEditing({
      id: "",
      title: "",
      title_ar: "",
      title_fr: "",
      slug: "",
      subtitle: "",
      subtitle_ar: "",
      subtitle_fr: "",
      heroText: "",
      heroText_ar: "",
      heroText_fr: "",
      description: "",
      description_ar: "",
      description_fr: "",
      article: "",
      article_ar: "",
      article_fr: "",
      seoTitle: "",
      seoTitle_ar: "",
      seoTitle_fr: "",
      seoDescription: "",
      seoDescription_ar: "",
      seoDescription_fr: "",
      seoKeywords: [],
      ogImage: "",
      published: true,
      noIndex: false,
      prioritiesCityIds: [],
      propertiesNeighborhoods: [],
      prioritiesPropertyTypeIds: [],
      prioritiesForSale: false,
      prioritiesFeatured: false,
      prioritiesMinPrice: null,
      prioritiesMaxPrice: null,
      prioritiesMinArea: null,
      prioritiesMaxArea: null,
      prioritiesMinRooms: null,
      prioritiesMaxRooms: null,
      prioritiesMinBathrooms: null,
      prioritiesMaxBathrooms: null,
      prioritiesPriceType: "MONTHLY",
    });
    setTab("editor");
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    const method = editing.id ? "PUT" : "POST";
    const url = editing.id
      ? `/api/admin/pages/${editing.id}`
      : `/api/admin/pages`;
    const payload: any = { ...editing };
    payload.article = editing.article ?? null;
    payload.seoKeywords = normalizeSeoKeywords(editing.seoKeywords);

    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const message = body?.error || body?.message || "Save failed";
      showToast("error", message);
      return;
    }
    const data = await res.json();
    if (editing.id) {
      setPages((s) => s.map((p) => (p.id === data.id ? data : p)));
    } else {
      setPages((s) => [data, ...s]);
    }
    showToast("success", t("adminPages.editor.saveSuccess", "Page saved."));
    setTab("list");
  }

  const t = (keyPath: string, fallback = "") => {
    if (!messages) return fallback;
    const parts = keyPath.split(".");
    let acc: unknown = messages as unknown;
    for (const p of parts) {
      if (
        acc &&
        typeof acc === "object" &&
        p in (acc as Record<string, unknown>)
      ) {
        acc = (acc as Record<string, unknown>)[p];
      } else {
        acc = undefined;
        break;
      }
    }
    return (typeof acc === "string" ? acc : fallback) as string;
  };

  const isRtl = locale === "ar";

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-6 top-6 z-50 flex items-center gap-2 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-top-2 ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
          }`}
          style={{ [isRtl ? "left" : "right"]: "1.5rem" }}
        >
          {toast.type === "success" ? (
            <Check className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">
              {t("adminPages.editor.deleteConfirm", "Delete this page?")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {isRtl
                ? "لا يمكن التراجع عن هذا الإجراء."
                : locale === "fr"
                  ? "Cette action est irréversible."
                  : "This action cannot be undone."}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="cursor-pointer rounded-xl border border-border/70 px-4 py-2 text-sm font-medium transition hover:bg-muted/40"
              >
                {t("adminPages.editor.cancel", "Cancel")}
              </button>
              <button
                onClick={() => deletePage(deleteConfirmId)}
                className="cursor-pointer rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
              >
                {t("adminPages.table.delete", "Delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk delete confirmation modal */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">
              {isRtl
                ? `حذف ${Object.keys(selected).filter((k) => selected[k]).length} صفحات؟`
                : `Delete ${Object.keys(selected).filter((k) => selected[k]).length} pages?`}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {isRtl
                ? "لا يمكن التراجع عن هذا الإجراء."
                : locale === "fr"
                  ? "Cette action est irréversible."
                  : "This action cannot be undone."}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setBulkDeleteConfirm(false)}
                className="cursor-pointer rounded-xl border border-border/70 px-4 py-2 text-sm font-medium transition hover:bg-muted/40"
              >
                {t("adminPages.editor.cancel", "Cancel")}
              </button>
              <button
                onClick={bulkDelete}
                className="cursor-pointer rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
              >
                {t("adminPages.table.delete", "Delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-10 w-64 rounded-xl border border-border/70 bg-background/80 pl-9 pr-4 text-sm outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                placeholder={t(
                  "adminPages.searchPlaceholder",
                  "Search title or slug",
                )}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {filtered.length} / {pages.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {Object.values(selected).filter(Boolean).length > 0 && (
              <button
                onClick={() => setBulkDeleteConfirm(true)}
                className="cursor-pointer flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-500/20 dark:text-rose-400"
              >
                <Trash2 className="h-4 w-4" />
                {t("adminPages.deleteSelected", "Delete Selected")}
                <span className="ml-1 rounded-full bg-rose-500/20 px-1.5 py-0.5 text-xs">
                  {Object.values(selected).filter(Boolean).length}
                </span>
              </button>
            )}
            <button
              onClick={openNew}
              className="cursor-pointer flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
            >
              <Plus className="h-4 w-4" />
              {t("adminPages.newPage", "New Page")}
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {tab === "list" ? (
        <div className="rounded-2xl border border-border/70 bg-card/50 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm rtl:text-right">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border accent-violet-600"
                      checked={
                        filtered.length > 0 &&
                        filtered.every((p) => selected[p.id])
                      }
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const map: Record<string, boolean> = {};
                        filtered.forEach((p) => (map[p.id] = checked));
                        setSelected(map);
                      }}
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {t("adminPages.table.title", "Title")}
                  </th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">
                    {t("adminPages.table.slug", "Slug")}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {t("adminPages.table.published", "Published")}
                  </th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">
                    {t("adminPages.table.created", "Created")}
                  </th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">
                    {t("adminPages.table.updated", "Updated")}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {t("adminPages.table.actions", "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className={`border-b border-border/40 transition hover:bg-muted/20 ${
                      selected[p.id] ? "bg-violet-500/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border accent-violet-600"
                        checked={!!selected[p.id]}
                        onChange={(e) =>
                          setSelected((s) => ({
                            ...s,
                            [p.id]: e.target.checked,
                          }))
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{p.title}</p>
                          <p className="text-xs text-muted-foreground md:hidden">
                            /{p.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground md:table-cell">
                      /{p.slug}
                    </td>
                    <td className="px-4 py-3">
                      {p.published ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {t("adminPages.table.published", "Published")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          {t("adminPages.table.draft", "Draft")}
                        </span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                      {new Date(p.createdAt).toLocaleDateString(
                        locale === "ar"
                          ? "ar-SA"
                          : locale === "fr"
                            ? "fr-FR"
                            : "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                      {new Date(p.updatedAt).toLocaleDateString(
                        locale === "ar"
                          ? "ar-SA"
                          : locale === "fr"
                            ? "fr-FR"
                            : "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditing({
                              ...p,
                              article: p.article || "",
                              article_ar: p.article_ar || "",
                              article_fr: p.article_fr || "",
                              seoKeywords: normalizeSeoKeywords(p.seoKeywords),
                            });
                            setTab("editor");
                          }}
                          className="cursor-pointer flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-violet-600 transition hover:bg-violet-500/10 dark:text-violet-400"
                        >
                          <FileEdit className="h-3.5 w-3.5" />
                          {t("adminPages.table.edit", "Edit")}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(p.id)}
                          className="cursor-pointer flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-500/10 dark:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t("adminPages.table.delete", "Delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground/40" />
                        <p>
                          {t("adminPages.table.noPages", "No pages found.")}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Editor */
        <div className="rounded-2xl border border-border/70 bg-card/50 backdrop-blur-sm">
          {/* Editor Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setTab("list");
                  setEditing(null);
                }}
                className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted/40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div>
                <h2 className="text-lg font-semibold">
                  {editing?.id
                    ? t("adminPages.editor.edit", "Edit Page")
                    : t("adminPages.editor.create", "Create Page")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {editing?.slug ? `/${editing.slug}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setTab("list");
                  setEditing(null);
                }}
                className="cursor-pointer flex items-center gap-2 rounded-xl border border-border/70 px-4 py-2 text-sm font-medium transition hover:bg-muted/40"
              >
                <X className="h-4 w-4" />
                {t("adminPages.editor.cancel", "Cancel")}
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="cursor-pointer flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving
                  ? t("adminPages.editor.saving", "Saving...")
                  : t("adminPages.editor.save", "Save")}
              </button>
            </div>
          </div>

          {/* Editor Body */}
          <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
            {/* Left Column — Content */}
            <div className="space-y-5 lg:col-span-2">
              {/* Basic Info Section */}
              <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/10 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <FileText className="h-4 w-4 text-violet-500" />
                    {t("adminPages.editor.basicInfo", "Basic Information")}
                  </h3>
                  <LangSwitcher langTab={langTab} onChange={setLangTab} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <LocalizedInput
                    label={t("adminPages.editor.titleLabel", "Title")}
                    required
                    placeholder="Page title"
                    langTab={langTab}
                    enValue={editing?.title || ""}
                    arValue={editing?.title_ar ?? undefined}
                    frValue={editing?.title_fr ?? undefined}
                    onEnChange={(v) =>
                      setEditing({
                        ...editing,
                        title: v,
                        slug:
                          editing && !editing.slug ? slugify(v) : editing?.slug,
                      })
                    }
                    onArChange={(v) => setEditing({ ...editing, title_ar: v })}
                    onFrChange={(v) => setEditing({ ...editing, title_fr: v })}
                  />
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      {t("adminPages.editor.slugLabel", "Slug")} *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        /
                      </span>
                      <input
                        className="w-full rounded-xl border border-border/70 bg-background/80 pl-7 pr-3.5 py-2.5 text-sm outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                        placeholder="my-page-slug"
                        value={editing?.slug || ""}
                        onChange={(e) =>
                          setEditing({ ...editing, slug: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
                <LocalizedInput
                  label={t("adminPages.editor.subtitleLabel", "Subtitle")}
                  placeholder="A short subtitle"
                  langTab={langTab}
                  enValue={editing?.subtitle || ""}
                  arValue={editing?.subtitle_ar ?? undefined}
                  frValue={editing?.subtitle_fr ?? undefined}
                  onEnChange={(v) => setEditing({ ...editing, subtitle: v })}
                  onArChange={(v) => setEditing({ ...editing, subtitle_ar: v })}
                  onFrChange={(v) => setEditing({ ...editing, subtitle_fr: v })}
                />
                <LocalizedInput
                  label={t("adminPages.editor.heroTextLabel", "Hero Text")}
                  placeholder="Hero section text"
                  langTab={langTab}
                  enValue={editing?.heroText || ""}
                  arValue={editing?.heroText_ar ?? undefined}
                  frValue={editing?.heroText_fr ?? undefined}
                  onEnChange={(v) => setEditing({ ...editing, heroText: v })}
                  onArChange={(v) => setEditing({ ...editing, heroText_ar: v })}
                  onFrChange={(v) => setEditing({ ...editing, heroText_fr: v })}
                />
                <LocalizedInput
                  label={t("adminPages.editor.descriptionLabel", "Description")}
                  type="textarea"
                  rows={3}
                  placeholder="Brief description or meta description"
                  langTab={langTab}
                  enValue={editing?.description || ""}
                  arValue={editing?.description_ar ?? undefined}
                  frValue={editing?.description_fr ?? undefined}
                  onEnChange={(v) => setEditing({ ...editing, description: v })}
                  onArChange={(v) =>
                    setEditing({ ...editing, description_ar: v })
                  }
                  onFrChange={(v) =>
                    setEditing({ ...editing, description_fr: v })
                  }
                />
              </div>

              {/* Article Section */}
              <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/10 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <FileEdit className="h-4 w-4 text-violet-500" />
                    {t("adminPages.editor.content", "Content")}
                  </h3>
                  <LangSwitcher langTab={langTab} onChange={setLangTab} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t("adminPages.editor.article", "Article")}
                    {langTab !== "en" && (
                      <span className="ml-1.5 text-[10px] uppercase text-violet-500">
                        ({langTab === "ar" ? "عربي" : "Français"})
                      </span>
                    )}
                  </label>
                  <div>
                    <textarea
                      className="w-full rounded-xl border border-border/70 bg-background/80 px-3.5 py-2.5 text-sm leading-relaxed outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                      rows={6}
                      dir={langTab === "ar" ? "rtl" : "ltr"}
                      value={
                        langTab === "ar"
                          ? editing?.article_ar || ""
                          : langTab === "fr"
                            ? editing?.article_fr || ""
                            : editing?.article || ""
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (langTab === "ar") {
                          setEditing({ ...editing, article_ar: val });
                        } else if (langTab === "fr") {
                          setEditing({ ...editing, article_fr: val });
                        } else {
                          setEditing({ ...editing, article: val });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column — Sidebar */}
            <aside className="space-y-5">
              {/* SEO Section */}
              <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/10 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Globe className="h-4 w-4 text-violet-500" />
                  {t("adminPages.editor.seo", "SEO Settings")}
                </h3>
                <div className="flex items-center justify-between gap-3">
                  <LangSwitcher langTab={langTab} onChange={setLangTab} />
                </div>
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                  <div className="space-y-3">
                    <div>
                      <LocalizedInput
                        label={t(
                          "adminPages.editor.seoTitleLabel",
                          "SEO Title",
                        )}
                        langTab={langTab}
                        placeholder="Title for search engines"
                        enValue={editing?.seoTitle || ""}
                        arValue={editing?.seoTitle_ar || ""}
                        frValue={editing?.seoTitle_fr || ""}
                        onEnChange={(v) =>
                          setEditing({ ...editing, seoTitle: v })
                        }
                        onArChange={(v) =>
                          setEditing({ ...editing, seoTitle_ar: v })
                        }
                        onFrChange={(v) =>
                          setEditing({ ...editing, seoTitle_fr: v })
                        }
                      />
                    </div>

                    <LocalizedInput
                      label={t(
                        "adminPages.editor.seoDescriptionLabel",
                        "SEO Description",
                      )}
                      langTab={langTab}
                      type="textarea"
                      rows={3}
                      enValue={editing?.seoDescription || ""}
                      arValue={editing?.seoDescription_ar || ""}
                      frValue={editing?.seoDescription_fr || ""}
                      onEnChange={(v) =>
                        setEditing({ ...editing, seoDescription: v })
                      }
                      onArChange={(v) =>
                        setEditing({ ...editing, seoDescription_ar: v })
                      }
                      onFrChange={(v) =>
                        setEditing({ ...editing, seoDescription_fr: v })
                      }
                    />
                  </div>
                  <div className="min-w-0">
                    <SeoKeywordsInput
                      label={t(
                        "adminPages.editor.seoKeywordsLabel",
                        "SEO Keywords",
                      )}
                      value={editing?.seoKeywords ?? []}
                      locale={currentLocale}
                      onChange={(next) =>
                        setEditing({
                          ...editing,
                          seoKeywords: next,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {t("adminPages.editor.ogImageLabel", "Open Graph Image")}
                  </label>
                  <input
                    className="w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                    placeholder="https://..."
                    value={editing?.ogImage || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, ogImage: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Publishing Section */}
              <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/10 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Settings2 className="h-4 w-4 text-violet-500" />
                  {t("adminPages.editor.publishing", "Publishing")}
                </h3>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-background/60 px-3.5 py-3 transition hover:bg-muted/20">
                  <div
                    className={`relative h-5 w-9 rounded-full transition ${
                      editing?.published
                        ? "bg-violet-600"
                        : "bg-muted-foreground/30"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                        editing?.published
                          ? isRtl
                            ? "right-0.5"
                            : "left-4"
                          : isRtl
                            ? "left-4"
                            : "left-0.5"
                      }`}
                    />
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={!!editing?.published}
                      onChange={(e) =>
                        setEditing({ ...editing, published: e.target.checked })
                      }
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {t("adminPages.editor.publishedLabel", "Published")}
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-background/60 px-3.5 py-3 transition hover:bg-muted/20">
                  <div
                    className={`relative h-5 w-9 rounded-full transition ${
                      editing?.noIndex
                        ? "bg-amber-500"
                        : "bg-muted-foreground/30"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                        editing?.noIndex
                          ? isRtl
                            ? "right-0.5"
                            : "left-4"
                          : isRtl
                            ? "left-4"
                            : "left-0.5"
                      }`}
                    />
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={!!editing?.noIndex}
                      onChange={(e) =>
                        setEditing({ ...editing, noIndex: e.target.checked })
                      }
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {t("adminPages.editor.noIndexLabel", "No Index")}
                  </span>
                </label>
              </div>

              {/* Priority Config Section */}
              <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/10 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <List className="h-4 w-4 text-violet-500" />
                  {t(
                    "adminPages.editor.priorities",
                    locale === "ar"
                      ? "تفضيلات العرض"
                      : locale === "fr"
                        ? "Priorités d'affichage"
                        : "Display Priorities",
                  )}
                </h3>

                <MultiSelect
                  label={t("adminPages.priorities.cities", "Cities")}
                  options={cities.map((c) => c.id)}
                  optionLabels={Object.fromEntries(
                    cities.map((c) => [c.id, c.name]),
                  )}
                  selected={editing?.prioritiesCityIds || []}
                  onSelect={handleCitySelect}
                />

                <MultiSelect
                  label={t(
                    "adminPages.priorities.neighborhoods",
                    "Neighborhoods",
                  )}
                  options={availableNeighborhoods}
                  optionLabels={Object.fromEntries(
                    neighborhoods.map((n) => [n.id, n.name]),
                  )}
                  selected={editing?.propertiesNeighborhoods || []}
                  onSelect={(vals) =>
                    setEditing({ ...editing, propertiesNeighborhoods: vals })
                  }
                />

                <MultiSelect
                  label={t(
                    "adminPages.priorities.propertyTypes",
                    "Property Types",
                  )}
                  options={propertyTypes.map((t) => t.id)}
                  optionLabels={Object.fromEntries(
                    propertyTypes.map((t) => [t.id, t.name]),
                  )}
                  selected={editing?.prioritiesPropertyTypeIds || []}
                  onSelect={(vals) =>
                    setEditing({ ...editing, prioritiesPropertyTypeIds: vals })
                  }
                />

                <div className="flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-xs transition hover:bg-muted/20">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-violet-600"
                      checked={editing?.prioritiesForSale || false}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          prioritiesForSale: e.target.checked,
                        })
                      }
                    />
                    {t("adminPages.priorities.forSaleOnly", "For Sale Only")}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-xs transition hover:bg-muted/20">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-violet-600"
                      checked={editing?.prioritiesFeatured || false}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          prioritiesFeatured: e.target.checked,
                        })
                      }
                    />
                    {t("adminPages.priorities.featuredOnly", "Featured Only")}
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-0.5 block text-[10px] font-medium text-muted-foreground">
                      {t("adminPages.priorities.minPrice", "Min Price")}
                    </label>
                    <input
                      className="w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                      value={editing?.prioritiesMinPrice ?? ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          prioritiesMinPrice: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] font-medium text-muted-foreground">
                      {t("adminPages.priorities.maxPrice", "Max Price")}
                    </label>
                    <input
                      className="w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                      value={editing?.prioritiesMaxPrice ?? ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          prioritiesMaxPrice: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] font-medium text-muted-foreground">
                      {t("adminPages.priorities.minArea", "Min Area")}
                    </label>
                    <input
                      className="w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                      value={editing?.prioritiesMinArea ?? ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          prioritiesMinArea: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] font-medium text-muted-foreground">
                      {t("adminPages.priorities.maxArea", "Max Area")}
                    </label>
                    <input
                      className="w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                      value={editing?.prioritiesMaxArea ?? ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          prioritiesMaxArea: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] font-medium text-muted-foreground">
                      {t("adminPages.priorities.minRooms", "Min Rooms")}
                    </label>
                    <input
                      className="w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                      value={editing?.prioritiesMinRooms ?? ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          prioritiesMinRooms: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] font-medium text-muted-foreground">
                      {t("adminPages.priorities.maxRooms", "Max Rooms")}
                    </label>
                    <input
                      className="w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                      value={editing?.prioritiesMaxRooms ?? ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          prioritiesMaxRooms: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] font-medium text-muted-foreground">
                      {t("adminPages.priorities.minBaths", "Min Baths")}
                    </label>
                    <input
                      className="w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                      value={editing?.prioritiesMinBathrooms ?? ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          prioritiesMinBathrooms: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] font-medium text-muted-foreground">
                      {t("adminPages.priorities.maxBaths", "Max Baths")}
                    </label>
                    <input
                      className="w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                      value={editing?.prioritiesMaxBathrooms ?? ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          prioritiesMaxBathrooms: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {t("adminPages.priorities.priceType", "Price Type")}
                  </label>
                  <select
                    className="w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                    value={editing?.prioritiesPriceType || "MONTHLY"}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        prioritiesPriceType: e.target.value,
                      })
                    }
                  >
                    <option value="MONTHLY">
                      {t("adminPages.priorities.priceType.monthly", "Monthly")}
                    </option>
                    <option value="DAILY">
                      {t("adminPages.priorities.priceType.daily", "Daily")}
                    </option>
                  </select>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}

export default PagesAdminClient;
