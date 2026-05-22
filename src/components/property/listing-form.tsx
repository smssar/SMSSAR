"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  BadgeDollarSign,
  ImagePlus,
  KeyRound,
  Loader,
  Save,
  Star,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getVideoThumbnailUrl } from "../../lib/media";
import type { Locale } from "@/lib/locales";
import type { Property } from "@/lib/site-data";
import type { ReactNode } from "react";

type UploadedAsset = {
  publicId: string;
  resourceType: "image" | "video" | "raw";
  url: string;
};

function isVideoUrl(url: string) {
  return url.includes("/video/upload/");
}

export function ListingForm({
  locale,
  title,
  defaultListing,
  propertyId,
  existingMedia = [],
  propertyTypes,
  cities = [],
  neighborhoods = [],
}: {
  locale: Locale;
  title: string;
  defaultListing?: Property;
  propertyId?: string;
  existingMedia?: Array<{
    id: string;
    url: string;
    publicId: string;
    type: string;
  }>;
  propertyTypes: Array<{
    id: string;
    name: string;
    name_ar?: string | null;
    name_fr?: string | null;
    slug: string | null;
  }>;
  cities?: Array<{
    name: string;
    name_ar?: string | null;
    name_fr?: string | null;
  }>;
  neighborhoods?: Array<{
    id: string;
    name: string;
    name_ar?: string | null;
    name_fr?: string | null;
    city: {
      name: string;
    };
  }>;
}) {
  const router = useRouter();
  const [imageAssets, setImageAssets] = useState<UploadedAsset[]>([]);
  const [coverUrl, setCoverUrl] = useState<string | undefined>(
    defaultListing?.imageUrl && !isVideoUrl(defaultListing.imageUrl)
      ? defaultListing.imageUrl
      : undefined,
  );
  const [existingMediaToDelete, setExistingMediaToDelete] = useState<
    Set<string>
  >(new Set());
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [cityError, setCityError] = useState<string | null>(null);
  const [neighborhoodError, setNeighborhoodError] = useState<string | null>(
    null,
  );
  const [areaError, setAreaError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const imageAssetsRef = useRef<UploadedAsset[]>([]);
  const savedRef = useRef(false);

  const [priceType, setPriceType] = useState<"MONTHLY" | "DAILY">(
    (defaultListing?.priceType as "MONTHLY" | "DAILY") ?? "MONTHLY",
  );

  const [listingType, setListingType] = useState<"BUY" | "RENT">(
    (defaultListing?.forSale as boolean) ? "BUY" : "RENT",
  );
  const [propertyType, setPropertyType] = useState<string>(
    (defaultListing?.propertyType as string) ?? propertyTypes[0]?.id ?? "",
  );

  const initialValues = useMemo(
    () => ({
      title: defaultListing?.title[locale] ?? "",
      city: defaultListing?.city[locale] ?? "",
      neighborhood: defaultListing?.neighborhood ?? "",
      price: defaultListing?.price?.toString() ?? "",
      rooms: defaultListing?.rooms?.toString() ?? "2",
      bathrooms: defaultListing?.bathrooms?.toString() ?? "1",
      area: defaultListing?.area?.toString() ?? "",
      description: defaultListing?.description[locale] ?? "",
    }),
    [defaultListing, locale],
  );

  const [formTitle, setFormTitle] = useState(initialValues.title);
  const [city, setCity] = useState(initialValues.city);
  const [neighborhood, setNeighborhood] = useState(initialValues.neighborhood);
  const [price, setPrice] = useState(initialValues.price);
  const [rooms, setRooms] = useState(initialValues.rooms);
  const [bathrooms, setBathrooms] = useState(initialValues.bathrooms);
  const [area, setArea] = useState(initialValues.area);
  const [formDescription, setFormDescription] = useState(
    initialValues.description,
  );

  const getLocalizedLabel = (item: {
    name: string;
    name_ar?: string | null;
    name_fr?: string | null;
  }) => {
    if (locale === "ar") return item.name_ar || item.name;
    if (locale === "fr") return item.name_fr || item.name;
    return item.name;
  };

  const availableNeighborhoods = useMemo(
    () => neighborhoods.filter((item) => item.city.name === city),
    [neighborhoods, city],
  );

  const totalMediaCount =
    imageAssets.length +
    existingMedia.filter((m) => !existingMediaToDelete.has(m.id)).length;

  const getNextCoverUrl = ({
    excludeImageIndex,
    excludeExistingMediaId,
  }: {
    excludeImageIndex?: number;
    excludeExistingMediaId?: string;
  }) => {
    const remainingExisting = existingMedia.filter(
      (media) =>
        !existingMediaToDelete.has(media.id) &&
        media.id !== excludeExistingMediaId &&
        media.type !== "video",
    );
    const remainingImages = imageAssets.filter(
      (asset, index) =>
        index !== excludeImageIndex && asset.resourceType !== "video",
    );

    return remainingExisting[0]?.url ?? remainingImages[0]?.url;
  };

  async function cleanupUnsavedImages(keepalive = false) {
    await Promise.all(
      imageAssetsRef.current.map((asset) =>
        fetch("/api/properties/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicId: asset.publicId,
            resourceType: asset.resourceType,
          }),
          keepalive,
        }),
      ),
    );
  }

  useEffect(() => {
    imageAssetsRef.current = imageAssets;
  }, [imageAssets]);

  useEffect(() => {
    if (coverUrl && !isVideoUrl(coverUrl)) return;

    const firstExisting = existingMedia.find(
      (m) => !existingMediaToDelete.has(m.id) && m.type !== "video",
    );
    const firstUploadedImage = imageAssets.find(
      (asset) => asset.resourceType !== "video",
    );
    const next = firstExisting?.url ?? firstUploadedImage?.url;
    if (!next) {
      if (coverUrl) {
        Promise.resolve().then(() => setCoverUrl(undefined));
      }
      return;
    }

    Promise.resolve().then(() => setCoverUrl(next));
  }, [existingMedia, imageAssets, existingMediaToDelete, coverUrl]);

  useEffect(() => {
    savedRef.current = saved;
  }, [saved]);

  useEffect(() => {
    return () => {
      if (savedRef.current || imageAssetsRef.current.length === 0) return;

      void cleanupUnsavedImages(true);
    };
  }, []);

  useEffect(() => {
    const handlePageExit = () => {
      if (savedRef.current || imageAssetsRef.current.length === 0) return;

      void cleanupUnsavedImages(true);
    };

    window.addEventListener("beforeunload", handlePageExit);
    window.addEventListener("pagehide", handlePageExit);

    return () => {
      window.removeEventListener("beforeunload", handlePageExit);
      window.removeEventListener("pagehide", handlePageExit);
    };
  }, []);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    if (saving) return;
    const newImages = Array.from(files);
    const remainingSlots = 3 - totalMediaCount;

    if (newImages.length > remainingSlots) {
      toast.error(
        locale === "ar"
          ? `يمكنك تحميل ${remainingSlots} ملف فقط.`
          : `You can only upload ${remainingSlots} file(s).`,
      );
      return;
    }

    setUploading(true);
    try {
      for (const file of newImages) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/properties/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMsg =
            data?.error ||
            data?.message ||
            `Upload failed with status ${response.status}`;
          throw new Error(errorMsg);
        }
        setImageAssets((prev) => [
          ...prev,
          {
            url: data.url,
            publicId: data.publicId,
            resourceType: data.resourceType,
          },
        ]);
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : locale === "ar"
            ? "تعذر رفع الملفات."
            : "Could not upload files.";
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (index: number) => {
    const asset = imageAssets[index];
    if (!asset) return;

    const response = await fetch("/api/properties/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publicId: asset.publicId,
        resourceType: asset.resourceType,
      }),
    });

    if (!response.ok) {
      toast.error(
        locale === "ar" ? "تعذر حذف الصورة." : "Could not delete the image.",
      );
      return;
    }

    setImageAssets((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (asset.url === coverUrl) {
        const nextCover = getNextCoverUrl({ excludeImageIndex: index });
        setCoverUrl(nextCover);
      }
      return next;
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-5 md:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            setTitleError(null);
            setCityError(null);
            setNeighborhoodError(null);
            setPriceError(null);
            setAreaError(null);
            setDescriptionError(null);
            setSaving(true);
            setError(null);
            setSaved(false);

            // Validate all fields
            let hasErrors = false;

            // Title validation
            if (!formTitle || formTitle.trim().length === 0) {
              const msg =
                locale === "ar"
                  ? "يجب إدخال عنوان العقار."
                  : "Please enter a listing title.";
              setTitleError(msg);
              hasErrors = true;
            } else if (formTitle.trim().length < 3) {
              const msg =
                locale === "ar"
                  ? "يجب أن يكون العنوان 3 أحرف على الأقل."
                  : "Title must be at least 3 characters.";
              setTitleError(msg);
              hasErrors = true;
            }

            // City validation
            if (!city || city.trim().length === 0) {
              const msg =
                locale === "ar" ? "يجب إدخال المدينة." : "Please enter a city.";
              setCityError(msg);
              hasErrors = true;
            } else if (city.trim().length < 2) {
              const msg =
                locale === "ar"
                  ? "يجب أن تكون المدينة حرفين على الأقل."
                  : "City must be at least 2 characters.";
              setCityError(msg);
              hasErrors = true;
            }

            // Neighborhood validation (optional)
            if (neighborhood && neighborhood.trim().length > 0) {
              if (neighborhood.trim().length < 2) {
                const msg =
                  locale === "ar"
                    ? "يجب أن يكون الحي حرفين على الأقل."
                    : "Neighborhood must be at least 2 characters.";
                setNeighborhoodError(msg);
                hasErrors = true;
              }
            } else {
              // clear any previous neighborhood error when empty
              setNeighborhoodError(null);
            }

            // Area validation (optional field, but if filled must be valid)
            if (area && area.trim().length > 0) {
              const areaNum = Number(area);
              if (isNaN(areaNum) || areaNum <= 0) {
                const msg =
                  locale === "ar"
                    ? "يجب أن تكون المساحة رقماً موجباً."
                    : "Area must be a positive number.";
                setAreaError(msg);
                hasErrors = true;
              }
            }

            // Description validation (optional but if provided must be meaningful)
            if (
              formDescription &&
              formDescription.trim().length > 0 &&
              formDescription.trim().length < 10
            ) {
              const msg =
                locale === "ar"
                  ? "يجب أن يكون الوصف 10 أحرف على الأقل."
                  : "Description must be at least 10 characters.";
              setDescriptionError(msg);
              hasErrors = true;
            }

            // Price validation
            const priceNum = Number(price);
            if (!price || isNaN(priceNum) || priceNum <= 0) {
              const msg =
                locale === "ar"
                  ? "يجب إدخال سعر صحيح وأكبر من صفر."
                  : "Please enter a valid price greater than 0.";
              setPriceError(msg);
              hasErrors = true;
            }

            // If any errors, stop and show them
            if (hasErrors) {
              const errorMsg =
                locale === "ar"
                  ? "يرجى تصحيح الأخطاء أعلاه."
                  : "Please fix the errors above.";
              setError(errorMsg);
              setSaving(false);
              return;
            }

            const imagesForBody = imageAssets.map((a) => ({
              url: a.url,
              publicId: a.publicId,
              type: a.resourceType === "video" ? "video" : "image",
            }));

            const existingMediaForBody = existingMedia
              .filter((m) => !existingMediaToDelete.has(m.id))
              .map((m) => ({ id: m.id, url: m.url, type: m.type }));

            const body = {
              title: formTitle,
              description: formDescription,
              city,
              neighborhood:
                neighborhood && neighborhood.trim().length > 0
                  ? neighborhood
                  : undefined,
              area: Number(area),
              rooms: Number(rooms),
              bathrooms: Number(bathrooms),
              price: Number(price),
              propertyTypeId: propertyType,
              featured: false,
              priceType,
              propertyType: propertyType || undefined,
              forSale: listingType === "BUY",
              imageUrl: coverUrl ?? null,
              videoUrl: null,
              images: imagesForBody,
              existingMedia: existingMediaForBody,
              deleteMediaIds: Array.from(existingMediaToDelete),
            } as const;

            try {
              const method = propertyId ? "PATCH" : "POST";
              const url = propertyId
                ? `/api/properties/${propertyId}`
                : "/api/properties";

              const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              });

              const payload = await res.json().catch(() => null);
              if (!res.ok) {
                const errorMsg =
                  payload?.error ||
                  payload?.message ||
                  (res.status === 400
                    ? locale === "ar"
                      ? "تحقق من صحة البيانات المدخلة."
                      : "Please check the information you entered."
                    : res.status === 401
                      ? locale === "ar"
                        ? "يجب تسجيل الدخول أولاً."
                        : "You must be logged in."
                      : res.status === 403
                        ? locale === "ar"
                          ? "ليس لديك صلاحية لإجراء هذا الإجراء."
                          : "You don't have permission to perform this action."
                        : res.status === 429
                          ? locale === "ar"
                            ? "يرجى المحاولة لاحقاً. تم تجاوز حد الطلبات."
                            : "Please try again later. Rate limit exceeded."
                          : locale === "ar"
                            ? "حدث خطأ عند حفظ العقار. يرجى المحاولة مرة أخرى."
                            : "An error occurred while saving. Please try again.");
                setSaved(false);
                setError(errorMsg);
                toast.error(errorMsg);
                return;
              }

              setSaved(true);
              setError(null);
              toast.success(
                locale === "ar" ? "تم حفظ العقار." : "Property saved.",
              );
              router.replace(`/${locale}/dashboard/seller/listings`);
              router.refresh();
            } catch (err) {
              console.error("Failed to save property:", err);
              const errorMsg =
                locale === "ar"
                  ? "فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى."
                  : "Network error. Please check your connection and try again.";
              setSaved(false);
              setError(errorMsg);
              toast.error(errorMsg);
            } finally {
              setSaving(false);
            }
          }}
        >
          {error && (
            <div className="md:col-span-2 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-200">
              <div className="font-semibold">
                {locale === "ar" ? "خطأ" : "Error"}
              </div>
              <div className="mt-1">{error}</div>
            </div>
          )}
          <Field
            label={locale === "ar" ? "عنوان العقار" : "Listing title"}
            required
          >
            <Input
              value={formTitle}
              onChange={(e) => {
                setFormTitle(e.target.value);
                setTitleError(null);
              }}
              className={titleError ? "border-red-500" : ""}
            />
            {titleError && (
              <div className="mt-1 text-sm text-red-600 dark:text-red-400">
                {titleError}
              </div>
            )}
          </Field>
          <Field label={locale === "ar" ? "المدينة" : "City"} required>
            <Select
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setNeighborhood("");
                setCityError(null);
              }}
              className={cityError ? "border-red-500" : ""}
            >
              <option value="">
                {locale === "ar" ? "اختر مدينة" : "Select a city"}
              </option>
              {cities.map((c) => (
                <option key={c.name} value={c.name}>
                  {getLocalizedLabel(c)}
                </option>
              ))}
            </Select>
            {cityError && (
              <div className="mt-1 text-sm text-red-600 dark:text-red-400">
                {cityError}
              </div>
            )}
          </Field>
          <Field label={locale === "ar" ? "الحي" : "Neighborhood"}>
            <Select
              value={neighborhood}
              onChange={(e) => {
                setNeighborhood(e.target.value);
                setNeighborhoodError(null);
              }}
              className={neighborhoodError ? "border-red-500" : ""}
            >
              <option value="">
                {!city
                  ? locale === "ar"
                    ? "اختر المدينة أولاً"
                    : "Select a city first"
                  : availableNeighborhoods.length === 0
                    ? locale === "ar"
                      ? "لا توجد أحياء لهذه المدينة"
                      : "No neighborhoods for this city"
                    : locale === "ar"
                      ? "اختر الحي"
                      : "Select a neighborhood"}
              </option>
              {availableNeighborhoods.map((item) => (
                <option key={item.id} value={item.name}>
                  {getLocalizedLabel(item)}
                </option>
              ))}
            </Select>
            {neighborhoodError && (
              <div className="mt-1 text-sm text-red-600 dark:text-red-400">
                {neighborhoodError}
              </div>
            )}
            {city && availableNeighborhoods.length === 0 ? (
              <div className="mt-1 text-xs text-muted-foreground">
                {locale === "ar"
                  ? "أضف الأحياء لهذه المدينة من لوحة الإدارة أولاً."
                  : "Add neighborhoods for this city from the admin dashboard first."}
              </div>
            ) : null}
          </Field>

          <Field
            label={locale === "ar" ? "نوع الإعلان" : "Listing type"}
            required
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label
                className={`group flex cursor-pointer items-start gap-4 rounded-3xl border p-5 transition-all ${
                  listingType === "BUY"
                    ? "border-violet-500 bg-violet-500/5 shadow-sm ring-1 ring-violet-500/20"
                    : "border-border/70 bg-card/50 hover:border-violet-500/60 hover:bg-muted/40"
                }`}
              >
                <input
                  type="radio"
                  name="listingType"
                  value="BUY"
                  checked={listingType === "BUY"}
                  onChange={() => setListingType("BUY")}
                  className="mt-1 h-4 w-4 accent-violet-600"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-foreground">
                        {locale === "ar" ? "للبيع" : "Buy"}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {locale === "ar"
                          ? "اعرض العقار كسعر شراء نهائي للمستخدمين."
                          : "Show this property as a purchase listing."}
                      </p>
                    </div>
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                      <BadgeDollarSign className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </label>

              <label
                className={`group flex cursor-pointer items-start gap-4 rounded-3xl border p-5 transition-all ${
                  listingType === "RENT"
                    ? "border-violet-500 bg-violet-500/5 shadow-sm ring-1 ring-violet-500/20"
                    : "border-border/70 bg-card/50 hover:border-violet-500/60 hover:bg-muted/40"
                }`}
              >
                <input
                  type="radio"
                  name="listingType"
                  value="RENT"
                  checked={listingType === "RENT"}
                  onChange={() => setListingType("RENT")}
                  className="mt-1 h-4 w-4 accent-violet-600"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-foreground">
                        {locale === "ar" ? "للإيجار" : "Rent"}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {locale === "ar"
                          ? "اعرض العقار كخيار إيجار شهري أو يومي."
                          : "Show this property as a monthly or daily rental."}
                      </p>
                    </div>
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                      <KeyRound className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </label>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {locale === "ar"
                ? "اختر خياراً واحداً فقط، وسيُحفظ على أنه بيع أو إيجار."
                : "Choose one option only. It will be saved as either buy or rent."}
            </p>
          </Field>

          {listingType === "RENT" && (
            <div className="md:col-span-2 space-y-4 rounded-3xl border border-border/70 bg-card/50 p-5">
              <div>
                <Label className="mb-3 block font-medium">
                  {locale === "ar" ? "نوع السعر" : "Price Type"}
                  <span className="ml-1 text-red-500">*</span>
                </Label>
                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/70 px-4 py-3 transition hover:border-violet-500/60">
                    <input
                      type="radio"
                      name="priceType"
                      value="MONTHLY"
                      checked={priceType === "MONTHLY"}
                      onChange={() => setPriceType("MONTHLY")}
                      className="h-4 w-4 accent-violet-600"
                    />
                    <span className="text-sm font-medium">
                      {locale === "ar" ? "شهري" : "Monthly"}
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/70 px-4 py-3 transition hover:border-violet-500/60">
                    <input
                      type="radio"
                      name="priceType"
                      value="DAILY"
                      checked={priceType === "DAILY"}
                      onChange={() => setPriceType("DAILY")}
                      className="h-4 w-4 accent-violet-600"
                    />
                    <span className="text-sm font-medium">
                      {locale === "ar" ? "يومي" : "Daily"}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="price-input" className="mb-2 block font-medium">
                  {priceType === "MONTHLY"
                    ? locale === "ar"
                      ? "السعر الشهري (د.م / MAD)"
                      : "Monthly price (MAD)"
                    : locale === "ar"
                      ? "السعر اليومي (د.م / MAD)"
                      : "Daily price (MAD)"}
                  <span className="ml-1 text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="price-input"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      setPriceError(null);
                    }}
                    inputMode="numeric"
                    placeholder={locale === "ar" ? "أدخل السعر" : "Enter price"}
                    className={priceError ? "border-red-500" : ""}
                  />
                  <span className="whitespace-nowrap text-sm font-medium text-muted-foreground">
                    {priceType === "MONTHLY"
                      ? locale === "ar"
                        ? "/الشهر"
                        : "/month"
                      : locale === "ar"
                        ? "/اليوم"
                        : "/day"}
                  </span>
                </div>
                {priceError && (
                  <div className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {priceError}
                  </div>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {locale === "ar"
                    ? "اختر نوع السعر أولاً ثم أدخل القيمة المناسبة."
                    : "Choose Monthly or Daily first, then enter the matching price."}
                </p>
              </div>
            </div>
          )}

          {listingType === "BUY" && (
            <div className="md:col-span-2 rounded-3xl border border-border/70 bg-card/50 p-5">
              <Label
                htmlFor="buy-price-input"
                className="mb-2 block font-medium"
              >
                {locale === "ar" ? "السعر" : "Price"}
                <span className="ml-1 text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="buy-price-input"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    setPriceError(null);
                  }}
                  inputMode="numeric"
                  placeholder={locale === "ar" ? "أدخل السعر" : "Enter price"}
                  className={priceError ? "border-red-500" : ""}
                />
                <span className="whitespace-nowrap text-sm font-medium text-muted-foreground">
                  {locale === "ar" ? "درهم" : "MAD"}
                </span>
              </div>
              {priceError && (
                <div className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {priceError}
                </div>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {locale === "ar"
                  ? "أدخل سعر البيع النهائي للعقار."
                  : "Enter the final sale price for this property."}
              </p>
            </div>
          )}

          <Field label={locale === "ar" ? "عدد الغرف" : "Rooms"}>
            <Select value={rooms} onChange={(e) => setRooms(e.target.value)}>
              {[1, 2, 3, 4, 5].map((room) => (
                <option key={room} value={room}>
                  {room}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={locale === "ar" ? "المساحة" : "Area"}>
            <div className="group rounded-3xl border border-border/70 bg-card/50 p-1.5 shadow-sm transition focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500/20">
              <div className="flex items-center gap-2 rounded-2xl bg-background px-4 py-3">
                <Input
                  value={area}
                  onChange={(e) => {
                    setArea(e.target.value);
                    setAreaError(null);
                  }}
                  inputMode="numeric"
                  placeholder={locale === "ar" ? "مثال: 120" : "e.g. 120"}
                  className={`border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 ${areaError ? "text-red-600 placeholder:text-red-300" : ""}`}
                />
                <div className="flex h-10 items-center rounded-2xl border border-border/70 bg-muted/60 px-3 text-sm font-medium text-muted-foreground">
                  m²
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>
                {locale === "ar"
                  ? "أدخل المساحة بالمتر المربع."
                  : "Enter the area in square meters."}
              </span>
              {areaError ? (
                <span className="text-red-600 dark:text-red-400">
                  {areaError}
                </span>
              ) : null}
            </div>
          </Field>
          <Field
            label={locale === "ar" ? "نوع العقار" : "Property type"}
            required
          >
            <Select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              required
            >
              <option value="" disabled>
                {locale === "ar" ? "اختر نوع العقار" : "Select a property type"}
              </option>
              {propertyTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {getLocalizedLabel(item)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={locale === "ar" ? "الحمامات" : "Bathrooms"}>
            <Select
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
            >
              {[1, 2, 3, 4].map((bathroom) => (
                <option key={bathroom} value={bathroom}>
                  {bathroom}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={locale === "ar" ? "الوصف" : "Description"} full>
            <Textarea
              value={formDescription}
              onChange={(e) => {
                setFormDescription(e.target.value);
                setDescriptionError(null);
              }}
              className={descriptionError ? "border-red-500" : ""}
            />
            {descriptionError && (
              <div className="mt-1 text-sm text-red-600 dark:text-red-400">
                {descriptionError}
              </div>
            )}
          </Field>

          <div className="md:col-span-2">
            <Label className="mb-2 block">
              {locale === "ar" ? "صور ومقاطع الفيديو" : "Photos & Videos"} (
              {totalMediaCount}/3)
            </Label>

            {/* Display existing media */}
            {existingMedia.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                  {locale === "ar" ? "الملفات الحالية" : "Current files"}
                </h3>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                  {existingMedia.map((media) => {
                    const isDeleted = existingMediaToDelete.has(media.id);
                    const isVideo = media.type === "video";
                    const previewUrl = isVideo
                      ? getVideoThumbnailUrl(media.url)
                      : media.url;

                    return (
                      <div
                        key={media.id}
                        className={`relative group overflow-hidden rounded-lg border transition ${
                          isDeleted
                            ? "border-red-300 bg-red-50 opacity-50"
                            : "border-border hover:border-red-300"
                        }`}
                        style={{ aspectRatio: "2/1" }}
                      >
                        <Image
                          src={previewUrl}
                          alt="Property media"
                          fill
                          sizes="(max-width: 768px) 50vw, 33vw"
                          quality={75}
                          priority={false}
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                            <Video className="h-6 w-6 text-white" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (isDeleted) {
                              setExistingMediaToDelete((prev) => {
                                const next = new Set(prev);
                                next.delete(media.id);
                                return next;
                              });
                            } else {
                              setExistingMediaToDelete((prev) => {
                                const next = new Set(prev);
                                next.add(media.id);
                                if (coverUrl === media.url) {
                                  setCoverUrl(
                                    getNextCoverUrl({
                                      excludeExistingMediaId: media.id,
                                    }),
                                  );
                                }
                                return next;
                              });
                            }
                          }}
                          className={`absolute top-1 ${locale === "ar" ? "left-1" : "right-1"} ${
                            isDeleted
                              ? "bg-blue-500 hover:bg-blue-600"
                              : "bg-red-500 hover:bg-red-600"
                          } text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition z-10`}
                        >
                          {isDeleted ? (
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (isVideo) return;
                            // mark this existing media as cover
                            if (coverUrl === media.url) return;
                            setCoverUrl(media.url);
                          }}
                          className={`absolute bottom-1 ${locale === "ar" ? "right-1" : "left-1"} bg-black/60 text-white rounded-full px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition z-10`}
                        >
                          {isVideo ? (
                            <span className="flex items-center gap-1">
                              Video cannot be cover
                            </span>
                          ) : coverUrl === media.url ? (
                            <span className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-300" />
                              Cover
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              Set cover
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upload area for new media */}
            {totalMediaCount < 3 && (
              <div>
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                  {locale === "ar" ? "إضافة ملفات جديدة" : "Add new files"}
                </h3>
                <label
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  aria-disabled={uploading || saving}
                  className={`flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 text-center transition ${
                    uploading || saving
                      ? "cursor-not-allowed border-border/50 bg-muted/10 opacity-60"
                      : dragOver
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-border/80 bg-muted/20 hover:bg-muted/40"
                  }`}
                >
                  {uploading ? (
                    <Loader className="h-6 w-6 animate-spin text-violet-500" />
                  ) : saving ? (
                    <>
                      <Loader className="h-6 w-6 animate-spin text-violet-500" />
                      <span className="mt-3 text-sm font-medium">
                        {locale === "ar"
                          ? "جاري حفظ العقار..."
                          : "Saving listing..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <ImagePlus className="h-6 w-6 text-violet-500" />
                      <span className="mt-3 text-sm font-medium">
                        {locale === "ar"
                          ? "اسحب الصور أو الفيديوهات أو انقر للرفع"
                          : "Drag photos/videos or click to upload"}
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*,video/*"
                    disabled={uploading || saving}
                    onChange={(event) => handleFiles(event.target.files)}
                  />
                </label>
              </div>
            )}

            {/* Display newly uploaded media */}
            {imageAssets.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                  {locale === "ar"
                    ? "ملفات مرفوعة حديثاً"
                    : "Recently uploaded"}
                </h3>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                  {imageAssets.map((asset, index) => {
                    const isVideo = asset.resourceType === "video";
                    const previewUrl = isVideo
                      ? getVideoThumbnailUrl(asset.url)
                      : asset.url;
                    return (
                      <div
                        key={index}
                        className="relative group overflow-hidden rounded-lg border border-border"
                        style={{ aspectRatio: "2/1" }}
                      >
                        <Image
                          src={previewUrl}
                          alt={`Property ${isVideo ? "video" : "image"} ${index + 1}`}
                          fill
                          sizes="(max-width: 768px) 50vw, 33vw"
                          quality={75}
                          priority={index === 0}
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Video className="h-6 w-6 text-white" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className={`absolute top-1 ${locale === "ar" ? "left-1" : "right-1"} bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition z-10`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (isVideo) return;
                            if (coverUrl === asset.url) return;
                            setCoverUrl(asset.url);
                          }}
                          className={`absolute bottom-1 ${locale === "ar" ? "right-1" : "left-1"} bg-black/60 text-white rounded-full px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition z-10`}
                        >
                          {isVideo ? (
                            <span className="flex items-center gap-1">
                              Video cannot be cover
                            </span>
                          ) : coverUrl === asset.url ? (
                            <span className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-300" />
                              Cover
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              Set cover
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-muted/30 px-5 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground" />
            <Button
              type="submit"
              variant="accent"
              disabled={saving || uploading}
            >
              {saving ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving
                ? locale === "ar"
                  ? "جاري الحفظ..."
                  : "Saving..."
                : locale === "ar"
                  ? "حفظ العقار"
                  : "Save listing"}
            </Button>
          </div>

          {saved ? (
            <div className="md:col-span-2 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-200">
              {locale === "ar" ? "تم حفظ المسودة." : "Draft saved."}
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  children,
  full = false,
  required = false,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
  required?: boolean;
}) {
  return (
    <div className={full ? "space-y-2 md:col-span-2" : "space-y-2"}>
      <Label>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
}
