"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  BadgeDollarSign,
  ImagePlus,
  KeyRound,
  Loader,
  Trash2,
  Save,
  Star,
  Video,
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
import { getMessages } from "@/lib/messages";

type UploadedAsset = {
  publicId: string;
  resourceType: "image" | "video" | "raw";
  url: string;
};

type PlanMediaLimits = {
  maxImagesPerListing: number | null;
  maxVideosPerListing: number | null;
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
  type PurchaseWithProduct = {
    id: string;
    quantity: number;
    status: string;
    expiresAt: Date | null;
    purchaseProduct: {
      id: string;
      code: string | null;
      title: string;
      title_ar?: string | null;
      title_fr?: string | null;
    };
  };
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
  const [planMediaLimits, setPlanMediaLimits] =
    useState<PlanMediaLimits | null>(null);
  const [purchase, setPurchase] = useState<PurchaseWithProduct[] | null>(null);
  const [removingAssetIds, setRemovingAssetIds] = useState<Set<string>>(
    new Set(),
  );
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [upgradeDialogMessage, setUpgradeDialogMessage] = useState<string>("");
  const [upgradeDialogUrl, setUpgradeDialogUrl] = useState<string>(
    `/${locale}/pricing`,
  );
  const imageAssetsRef = useRef<UploadedAsset[]>([]);
  const savedRef = useRef(false);

  const [priceType, setPriceType] = useState<"MONTHLY" | "DAILY">(
    (defaultListing?.priceType as "MONTHLY" | "DAILY") ?? "MONTHLY",
  );

  const [listingType, setListingType] = useState<"BUY" | "RENT">(
    (defaultListing?.forSale as boolean) ? "BUY" : "RENT",
  );
  const [featured, setFeatured] = useState<boolean>(
    Boolean(defaultListing?.featured),
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

  const messages = getMessages(locale);

  const mediaActionsText = {
    setCover:
      locale === "ar"
        ? "تعيين كغلاف"
        : locale === "fr"
          ? "Definir la couverture"
          : "Set cover",
    cover:
      locale === "ar" ? "الغلاف" : locale === "fr" ? "Couverture" : "Cover",
    cannotBeCover:
      locale === "ar"
        ? "الفيديو لا يمكن أن يكون غلافاً"
        : locale === "fr"
          ? "Une video ne peut pas etre une couverture"
          : "Video cannot be cover",
    remove:
      locale === "ar" ? "إزالة" : locale === "fr" ? "Supprimer" : "Remove",
    restore:
      locale === "ar" ? "استرجاع" : locale === "fr" ? "Restaurer" : "Restore",
    removing:
      locale === "ar"
        ? "جاري الإزالة..."
        : locale === "fr"
          ? "Suppression..."
          : "Removing...",
  };

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

  const mediaCounts = useMemo(() => {
    const existing = existingMedia.filter(
      (m) => !existingMediaToDelete.has(m.id),
    );
    const existingImages = existing.filter((m) => m.type !== "video").length;
    const existingVideos = existing.filter((m) => m.type === "video").length;
    const uploadedImages = imageAssets.filter(
      (asset) => asset.resourceType !== "video",
    ).length;
    const uploadedVideos = imageAssets.filter(
      (asset) => asset.resourceType === "video",
    ).length;

    const imageCount = existingImages + uploadedImages;
    const videoCount = existingVideos + uploadedVideos;

    return {
      imageCount,
      videoCount,
      totalCount: imageCount + videoCount,
    };
  }, [imageAssets, existingMedia, existingMediaToDelete]);
  const extraImages = (purchase ?? [])
    .filter((p) => {
      return p.purchaseProduct?.code === "EXTRA_IMAGES";
    })
    .reduce((sum, p) => sum + p.quantity, 0);

  const extraVideos = (purchase ?? [])
    .filter((p) => {
      return p.purchaseProduct?.code === "EXTRA_VIDEOS";
    })
    .reduce((sum, p) => sum + p.quantity, 0);

  // Final limits = plan base + purchased extras
  // null means unlimited (plan has no cap)
  const imageLimit =
    planMediaLimits?.maxImagesPerListing != null
      ? planMediaLimits.maxImagesPerListing + extraImages
      : null;
  const videoLimit =
    planMediaLimits?.maxVideosPerListing != null
      ? planMediaLimits.maxVideosPerListing + extraVideos
      : null;

  const canUploadMore =
    imageLimit === null ||
    mediaCounts.imageCount < imageLimit ||
    videoLimit === null ||
    mediaCounts.videoCount < videoLimit;
  console.log("planMediaLimits", planMediaLimits, "extraImages:", extraImages);

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

  useEffect(() => {
    const loadPlanLimits = async () => {
      try {
        const res = await fetch("/api/plans/user", { cache: "no-store" });
        const payload = await res.json().catch(() => null);

        console.log("Fetched plan info:", payload);

        if (!res.ok || !payload?.data) return;

        setPlanMediaLimits({
          maxImagesPerListing: payload.data.maxImagesPerListing,
          maxVideosPerListing: payload.data.maxVideosPerListing,
        });

        console.log("API limits:", payload.data);
      } catch {
        toast.error(
          locale === "ar"
            ? "تعذر جلب معلومات الخطة."
            : "Could not fetch plan information.",
        );
      }
    };

    const loadPurchase = async () => {
      try {
        const res = await fetch("/api/users/purchases", { cache: "no-store" });
        const payload = await res.json().catch(() => null);
        if (!res.ok || !payload?.purchases) return;
        setPurchase(payload.purchases ?? null);
      } catch {
        toast.error(
          locale === "ar"
            ? "تعذر جلب معلومات المشتريات."
            : "Could not fetch purchase information.",
        );
      }
    };

    void loadPlanLimits();
    void loadPurchase();
  }, []);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    if (saving) return;
    const newImages = Array.from(files);
    let nextImageCount = mediaCounts.imageCount;
    let nextVideoCount = mediaCounts.videoCount;
    const acceptedFiles: File[] = [];
    let skippedCount = 0;

    for (const file of newImages) {
      const isVideo = (file.type || "").startsWith("video/");

      if (isVideo) {
        if (videoLimit !== null && nextVideoCount >= videoLimit) {
          skippedCount += 1;
          continue;
        }
        nextVideoCount += 1;
        acceptedFiles.push(file);
      } else {
        if (imageLimit !== null && nextImageCount >= imageLimit) {
          skippedCount += 1;
          continue;
        }
        nextImageCount += 1;
        acceptedFiles.push(file);
      }
    }

    if (skippedCount > 0) {
      const message =
        locale === "ar"
          ? "وصلت إلى حد الخطة الحالي للوسائط. قم بالترقية لإضافة المزيد من الصور أو الفيديوهات."
          : locale === "fr"
            ? "Vous avez atteint la limite media de votre forfait actuel. Passez a un forfait superieur pour ajouter plus de fichiers."
            : "You've reached your current plan media limit. Upgrade your plan to add more images or videos.";

      setUpgradeDialogMessage(message);
      setUpgradeDialogUrl(`/${locale}/pricing`);
      setUpgradeDialogOpen(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (acceptedFiles.length === 0) {
      return;
    }

    setUploading(true);
    try {
      for (const file of acceptedFiles) {
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
    if (removingAssetIds.has(asset.publicId)) return;

    setRemovingAssetIds((prev) => {
      const next = new Set(prev);
      next.add(asset.publicId);
      return next;
    });

    try {
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
          locale === "ar"
            ? "تعذر حذف الصورة."
            : locale === "fr"
              ? "Impossible de supprimer le fichier."
              : "Could not delete the file.",
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
    } finally {
      setRemovingAssetIds((prev) => {
        const next = new Set(prev);
        next.delete(asset.publicId);
        return next;
      });
    }
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

            let hasErrors = false;

            if (!formTitle || formTitle.trim().length === 0) {
              setTitleError(
                messages.dashboard.seller.validation.title.required,
              );
              hasErrors = true;
            } else if (formTitle.trim().length < 3) {
              setTitleError(
                messages.dashboard.seller.validation.title.minLength,
              );
              hasErrors = true;
            }

            if (!area) {
              setAreaError(messages.dashboard.seller.validation.area.required);
              hasErrors = true;
            }
            if (!city || city.trim().length === 0) {
              setCityError(messages.dashboard.seller.validation.city.required);
              hasErrors = true;
            } else if (city.trim().length < 2) {
              setCityError(messages.dashboard.seller.validation.city.minLength);
              hasErrors = true;
            }

            if (neighborhood && neighborhood.trim().length > 0) {
              if (neighborhood.trim().length < 2) {
                setNeighborhoodError(
                  messages.dashboard.seller.validation.neighborhood.minLength,
                );
                hasErrors = true;
              }
            } else {
              // clear any previous neighborhood error when empty
              setNeighborhoodError(null);
            }

            if (area && area.trim().length > 0) {
              const areaNum = Number(area);
              if (isNaN(areaNum) || areaNum <= 0) {
                setAreaError(
                  messages.dashboard.seller.validation.area.positive,
                );
                hasErrors = true;
              }
            }

            if (
              formDescription &&
              formDescription.trim().length > 0 &&
              formDescription.trim().length < 10
            ) {
              setDescriptionError(
                messages.dashboard.seller.validation.description.minLength,
              );
              hasErrors = true;
            }

            const priceNum = Number(price);
            if (!price || isNaN(priceNum) || priceNum <= 0) {
              setPriceError(
                messages.dashboard.seller.validation.price.required,
              );
              hasErrors = true;
            }

            // If any errors, stop and show them
            if (hasErrors) {
              setError(messages.dashboard.seller.validation.fixErrors);
              setSaving(false);
              // Scroll to top so the user sees the error banner
              window.scrollTo({ top: 0, behavior: "smooth" });
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
              featured,
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
                headers: {
                  "Content-Type": "application/json",
                  "x-locale": locale,
                },
                body: JSON.stringify(body),
              });

              const payload = await res.json().catch(() => null);
              if (!res.ok) {
                if (
                  payload?.code === "PLAN_MEDIA_LIMIT_IMAGES" ||
                  payload?.code === "PLAN_MEDIA_LIMIT_VIDEOS" ||
                  payload?.code === "LISTINGS_LIMIT_REACHED" ||
                  payload?.code === "LISTINGS_LIMIT_WITH_PURCHASE" ||
                  payload?.code === "FEATURED_NOT_ALLOWED" ||
                  payload?.code === "FEATURED_LIMIT_REACHED"
                ) {
                  setUpgradeDialogMessage(
                    payload?.error ||
                      (locale === "ar"
                        ? "لقد وصلت إلى حد الخطة الحالية."
                        : locale === "fr"
                          ? "Vous avez atteint la limite de votre forfait."
                          : "You reached your plan limit."),
                  );
                  setUpgradeDialogUrl(
                    payload?.upgradeUrl || `/${locale}/pricing`,
                  );
                  setUpgradeDialogOpen(true);
                  setSaved(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  return;
                }

                // Apply server-returned field errors if present
                if (payload?.fieldErrors) {
                  setTitleError(payload.fieldErrors.title ?? null);
                  setCityError(payload.fieldErrors.city ?? null);
                  setNeighborhoodError(
                    payload.fieldErrors.neighborhood ?? null,
                  );
                  setAreaError(payload.fieldErrors.area ?? null);
                  setPriceError(payload.fieldErrors.price ?? null);
                  setDescriptionError(payload.fieldErrors.description ?? null);
                  // Show top-level error if present
                  const top = payload?.error || payload?.message;
                  const errorMsg =
                    top ||
                    (locale === "ar"
                      ? "تحقق من صحة البيانات المدخلة."
                      : "Please check the information you entered.");
                  setSaved(false);
                  setError(errorMsg);
                  toast.error(errorMsg);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  return;
                }

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
                window.scrollTo({ top: 0, behavior: "smooth" });
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
              window.scrollTo({ top: 0, behavior: "smooth" });
            } finally {
              setSaving(false);
            }
          }}
        >
          {upgradeDialogOpen ? (
            <div className="md:col-span-2 rounded-2xl border border-violet-300 bg-violet-50 p-4 text-sm text-violet-900 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-100">
              <div className="font-semibold">
                {locale === "ar"
                  ? "تحتاج إلى ترقية أو شراء إضافات"
                  : locale === "fr"
                    ? "Mise a niveau ou achat requis"
                    : "Upgrade or purchase required"}
              </div>
              <div className="mt-1">{upgradeDialogMessage}</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  href={upgradeDialogUrl}
                  className="inline-flex items-center rounded-md bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700"
                >
                  {locale === "ar"
                    ? "ترقية الخطة"
                    : locale === "fr"
                      ? "Mettre a niveau"
                      : "Upgrade plan"}
                </Link>
                <Link
                  href={`/${locale}/dashboard/seller/purchases`}
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  {locale === "ar"
                    ? "شراء إضافات"
                    : locale === "fr"
                      ? "Acheter des options"
                      : "Buy add-ons"}
                </Link>
                <button
                  type="button"
                  onClick={() => setUpgradeDialogOpen(false)}
                  className="inline-flex items-center rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  {locale === "ar"
                    ? "إغلاق"
                    : locale === "fr"
                      ? "Fermer"
                      : "Close"}
                </button>
              </div>
            </div>
          ) : null}

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
              disabled={!city}
              className={`${neighborhoodError ? "border-red-500" : ""} ${!city ? "opacity-60 pointer-events-none" : ""}`}
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

          <Field label={locale === "ar" ? "العقار المميز" : "Featured listing"}>
            <label className="flex cursor-pointer items-start gap-3 rounded-3xl border border-border/70 bg-card/50 p-4 transition hover:border-violet-500/60 hover:bg-muted/40">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="mt-1 h-4 w-4 accent-violet-600"
              />
              <div className="space-y-1">
                <div className="text-sm font-semibold text-foreground">
                  {locale === "ar" ? "عرض العقار كـ مميز" : "Mark as featured"}
                </div>
                <p className="text-sm text-muted-foreground">
                  {locale === "ar"
                    ? "سيظهر هذا العقار كبطاقة مميزة في القوائم والعرض العام."
                    : "Show this property as a featured listing in cards and listings."}
                </p>
              </div>
            </label>
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
          <Field label={locale === "ar" ? "المساحة" : "Area"} required>
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
              {mediaCounts.totalCount})
            </Label>
            <div className="mb-3 text-xs text-muted-foreground">
              {locale === "ar"
                ? `الصور: ${mediaCounts.imageCount}/${imageLimit ?? "∞"} • الفيديوهات: ${mediaCounts.videoCount}/${videoLimit ?? "∞"}`
                : locale === "fr"
                  ? `Images: ${mediaCounts.imageCount}/${imageLimit ?? "∞"} • Videos: ${mediaCounts.videoCount}/${videoLimit ?? "∞"}`
                  : `Images: ${mediaCounts.imageCount}/${imageLimit ?? "∞"} • Videos: ${mediaCounts.videoCount}/${videoLimit ?? "∞"}`}
            </div>

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
                          className={`absolute top-2 ${locale === "ar" ? "left-2" : "right-2"} inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium shadow-sm transition z-10 bg-amber-700 ${
                            isDeleted
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-yellow-600 text-white hover:bg-red-700"
                          }`}
                        >
                          {isDeleted ? (
                            <>
                              <svg
                                className="h-3.5 w-3.5"
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
                              <span>{mediaActionsText.restore}</span>
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>{mediaActionsText.remove}</span>
                            </>
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
                          className={`absolute bottom-2 ${locale === "ar" ? "right-2" : "left-2"} inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium shadow-sm transition z-10 cursor-pointer ${
                            coverUrl === media.url
                              ? "bg-amber-500 text-black"
                              : "bg-black/70 text-white hover:bg-black/80"
                          }`}
                        >
                          {isVideo ? (
                            <span className="flex items-center gap-1">
                              {mediaActionsText.cannotBeCover}
                            </span>
                          ) : coverUrl === media.url ? (
                            <span className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-300" />
                              {mediaActionsText.cover}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              {mediaActionsText.setCover}
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
            {canUploadMore ? (
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
            ) : (
              <div className="md:col-span-2 rounded-2xl border border-violet-300 bg-violet-50 p-4 text-sm text-violet-900 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-100">
                <div className="font-semibold">
                  {locale === "ar"
                    ? "تحتاج إلى ترقية أو شراء إضافات"
                    : locale === "fr"
                      ? "Mise a niveau ou achat requis"
                      : "Upgrade or purchase required"}
                </div>
                <div className="mt-1">
                  {locale === "ar"
                    ? "لقد وصلت إلى حد الخطة الحالية للوسائط. قم بالترقية أو شراء إضافات لإضافة المزيد من الصور أو الفيديوهات."
                    : locale === "fr"
                      ? "Vous avez atteint la limite media de votre forfait actuel. Mettez a niveau ou achetez des options pour ajouter plus de fichiers."
                      : "You've reached your current plan media limit. Upgrade your plan or buy add-ons to add more images or videos."}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/${locale}/pricing`}
                    className="inline-flex items-center rounded-md bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700"
                  >
                    {locale === "ar"
                      ? "ترقية الخطة"
                      : locale === "fr"
                        ? "Mettre a niveau"
                        : "Upgrade plan"}
                  </Link>
                  <Link
                    href={`/${locale}/dashboard/seller/purchases`}
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    {locale === "ar"
                      ? "شراء إضافات"
                      : locale === "fr"
                        ? "Acheter des options"
                        : "Buy add-ons"}
                  </Link>
                </div>
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
                    const isRemoving = removingAssetIds.has(asset.publicId);
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
                          disabled={isRemoving}
                          className={`absolute top-2 ${locale === "ar" ? "left-2" : "right-2"} inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium shadow-sm transition z-10 cursor-pointer ${
                            isRemoving
                              ? "bg-red-300 text-red-100 cursor-not-allowed"
                              : "bg-red-600 text-white hover:bg-red-700"
                          }`}
                        >
                          {isRemoving ? (
                            <>
                              <Loader className="h-3.5 w-3.5 animate-spin" />
                              <span>{mediaActionsText.removing}</span>
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>{mediaActionsText.remove}</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (isVideo) return;
                            if (coverUrl === asset.url) return;
                            setCoverUrl(asset.url);
                          }}
                          className={`absolute bottom-2 ${locale === "ar" ? "right-2" : "left-2"} inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium shadow-sm transition z-10 cursor-pointer ${
                            coverUrl === asset.url
                              ? "bg-amber-500 text-black"
                              : "bg-black/70 text-white hover:bg-black/80"
                          }`}
                        >
                          {isVideo ? (
                            <span className="flex items-center gap-1">
                              {mediaActionsText.cannotBeCover}
                            </span>
                          ) : coverUrl === asset.url ? (
                            <span className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-300" />
                              {mediaActionsText.cover}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              {mediaActionsText.setCover}
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
