/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Edit3,
  Eye,
  ImagePlus,
  Loader2,
  Save,
  Star,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getVideoThumbnailUrl } from "../../lib/media";
import { formatCurrency } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/locales";

type PropertyRow = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  neighborhood?: string | null;
  area: number | null;
  rooms: number;
  bathrooms: number | null;
  price: number;
  propertyTypeId?: string | null;
  featured: boolean;
  priceType?: string;
  propertyType?:
    | string
    | null
    | {
        id: string;
        name?: string;
        name_ar?: string | null;
        slug?: string | null;
        name_fr?: string | null;
      };
  forSale?: boolean;
  imageUrl: string | null;
  createdAt: Date | string;
  seller: {
    id: string;
    name: string | null;
    email: string | null;
  };
  media?: Array<{
    id: string;
    url: string;
    type: string;
  }>;
};

export function AdminListingsPanel({
  locale,
  initialListings,
  cities = [],
  neighborhoods = [],
  propertyTypes = [],
  currentPage,
  totalPages,
}: {
  locale: Locale;
  initialListings: PropertyRow[];
  propertyTypes?: Array<{
    id: string;
    name: string;
    name_ar?: string | null;
    name_fr?: string | null;
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
  currentPage: number;
  totalPages: number;
}) {
  const isVideoUrl = (url: string) => url.includes("/video/upload/");

  const router = useRouter();
  const searchParams = useSearchParams();

  const [listings, setListings] = useState(initialListings);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingMedia, setEditingMedia] = useState<PropertyRow["media"]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "save" | "delete";
    item?: PropertyRow;
  } | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [area, setArea] = useState("");
  const [rooms, setRooms] = useState("1");
  const [bathrooms, setBathrooms] = useState("");
  const [price, setPrice] = useState("0");
  const [priceType, setPriceType] = useState<"MONTHLY" | "DAILY">("MONTHLY");
  const [propertyType, setPropertyType] = useState<string>("");
  const [forSale, setForSale] = useState<boolean>(false);
  const [featured, setFeatured] = useState(false);
  const [newImages, setNewImages] = useState<
    Array<{ url: string; publicId: string; resourceType: string }>
  >([]);
  const [coverUrl, setCoverUrl] = useState<string | undefined>(undefined);
  const [existingMediaToDelete, setExistingMediaToDelete] = useState<
    Set<string>
  >(new Set());
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const currentSearch = (searchParams.get("search") as string) ?? "";
  const currentPageSize = (searchParams.get("pageSize") as string) ?? "10";

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

  const setPageParam = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    router.push(`?${params.toString()}`);
  };

  const updatePageSize = (pageSize: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (pageSize === "10") {
      params.delete("pageSize");
    } else {
      params.set("pageSize", pageSize);
    }
    params.delete("page"); // Reset to page 1 when changing page size
    router.push(`?${params.toString()}`);
  };

  const updateSearch = (newSearch: string) => {
    const params = new URLSearchParams();
    if (newSearch) params.set("search", newSearch);
    if (currentPageSize !== "10") params.set("pageSize", currentPageSize);
    router.push(`?${params.toString()}`);
  };

  const handleCityChange = (value: string) => {
    setCity(value);
    setNeighborhood("");
  };

  const heroMedia = useMemo(() => {
    const activeExistingMedia = (editingMedia ?? []).filter(
      (media) => !existingMediaToDelete.has(media.id),
    );

    if (coverUrl) {
      const selectedExisting = activeExistingMedia.find(
        (media) => media.url === coverUrl,
      );
      if (selectedExisting) return selectedExisting;

      const selectedNew = newImages.find((asset) => asset.url === coverUrl);
      if (selectedNew) return selectedNew;
    }

    return activeExistingMedia[0] ?? newImages[0] ?? null;
  }, [coverUrl, editingMedia, existingMediaToDelete, newImages]);

  const startEdit = (item: PropertyRow) => {
    setEditingId(item.id);
    setEditingMedia(item.media ?? []);
    setCoverUrl(
      item.imageUrl ?? item.media?.find((media) => media.type !== "video")?.url,
    );
    setTitle(item.title);
    setDescription(item.description ?? "");
    setCity(item.city);
    setNeighborhood(item.neighborhood ?? "");
    setArea(item.area === null ? "" : String(item.area));
    setRooms(String(item.rooms));
    setBathrooms(item.bathrooms === null ? "" : String(item.bathrooms));
    setPrice(String(item.price));
    setFeatured(item.featured);
    setPriceType((item.priceType as "MONTHLY" | "DAILY") ?? "MONTHLY");
    const pt =
      (item as any).propertyTypeId ??
      (typeof item.propertyType === "string"
        ? item.propertyType
        : ((item.propertyType as any)?.id ?? ""));
    setPropertyType(pt ?? "");
    setForSale(Boolean(item.forSale));
  };

  const requestEdit = (item: PropertyRow) => {
    startEdit(item);
    toast.info(
      locale === "ar"
        ? `تم فتح نموذج التعديل للعقار "${item.title}".`
        : `Edit form opened for "${item.title}".`,
    );
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingMedia([]);
    setCoverUrl(undefined);
    setTitle("");
    setDescription("");
    setCity("");
    setNeighborhood("");
    setArea("");
    setRooms("1");
    setBathrooms("");
    setPrice("0");
    setFeatured(false);
    setNewImages([]);
    setExistingMediaToDelete(new Set());
    setPriceType("MONTHLY");
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || uploading) return;

    const newFiles = Array.from(files);
    const totalMedia =
      (editingMedia?.length ?? 0) +
      newImages.length +
      (editingMedia?.filter((m) => !existingMediaToDelete.has(m.id)).length ??
        0);
    const remainingSlots = 10 - totalMedia;

    if (newFiles.length > remainingSlots) {
      toast.error(
        locale === "ar"
          ? `يمكنك تحميل ${remainingSlots} ملف فقط.`
          : `You can only upload ${remainingSlots} file(s).`,
      );
      return;
    }

    setUploading(true);
    try {
      for (const file of newFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/properties/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error || "Upload failed");
        }

        const data = (await response.json()) as {
          url: string;
          publicId: string;
          resourceType: "image" | "video" | "raw";
        };

        setNewImages((prev) => [
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
      toast.error(
        locale === "ar" ? "تعذر رفع الملفات." : "Could not upload files.",
      );
    } finally {
      setUploading(false);
    }
  };

  const removeNewImage = async (index: number) => {
    const asset = newImages[index];
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

    setNewImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (asset.url === coverUrl) {
        const nextCover =
          next.find((m) => m.resourceType !== "video")?.url ??
          editingMedia?.find(
            (m) => !existingMediaToDelete.has(m.id) && m.type !== "video",
          )?.url;
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
    void handleFiles(e.dataTransfer.files);
  };

  const openSaveConfirm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingId) return;

    setPendingAction({ type: "save" });
  };

  const performSave = async () => {
    if (!editingId) return;

    if (!title.trim()) {
      toast.error(
        locale === "ar" ? "يرجى إدخال العنوان" : "Please enter a title",
      );
      return;
    }

    if (!city.trim()) {
      toast.error(
        locale === "ar" ? "يرجى إدخال المدينة" : "Please enter a city",
      );
      return;
    }

    // Validate neighborhood is filled
    if (!neighborhood || neighborhood.trim().length === 0) {
      toast.error(
        locale === "ar" ? "يرجى إدخال الحي" : "Please enter a neighborhood",
      );
      setLoading(false);
      return;
    }

    if (neighborhood.trim().length < 2) {
      toast.error(
        locale === "ar"
          ? "يجب أن يكون الحي حرفين على الأقل"
          : "Neighborhood must be at least 2 characters",
      );
      setLoading(false);
      return;
    }

    if (!propertyType.trim()) {
      toast.error(
        locale === "ar"
          ? "يرجى اختيار نوع العقار"
          : "Please select a property type",
      );
      return;
    }

    if (!price.trim() || Number(price) <= 0) {
      toast.error(
        locale === "ar" ? "يرجى إدخال سعر صحيح" : "Please enter a valid price",
      );
      return;
    }

    if (!rooms.trim() || Number(rooms) <= 0) {
      toast.error(
        locale === "ar"
          ? "يرجى إدخال عدد غرف صحيح"
          : "Please enter a valid number of rooms",
      );
      return;
    }

    setLoading(true);

    try {
      const body: {
        title: string;
        description: string;
        city: string;
        neighborhood?: string | null;
        rooms: number;
        price: number;
        featured: boolean;
        area?: number;
        bathrooms?: number;
        imageUrl?: string | null;
        videoUrl?: string | null;
        images?: Array<{ url: string; publicId: string; type: string }>;
        existingMedia?: Array<{ id: string; url: string; type: string }>;
        deleteMediaIds?: string[];
        priceType?: string;
        propertyTypeId?: string | null;
        forSale?: boolean;
      } = {
        title: title.trim(),
        description: description.trim(),
        city: city.trim(),
        rooms: Number(rooms),
        price: Number(price),
        featured,
        priceType,
      };

      if (neighborhood.trim()) body.neighborhood = neighborhood.trim();
      if (area.trim()) body.area = Number(area);
      if (bathrooms.trim()) body.bathrooms = Number(bathrooms);
      if (propertyType.trim()) body.propertyTypeId = propertyType.trim();
      body.forSale = forSale;

      body.imageUrl = coverUrl && !isVideoUrl(coverUrl) ? coverUrl : null;
      body.videoUrl = null;

      // Add new images
      if (newImages.length > 0) {
        body.images = newImages.map((asset) => ({
          url: asset.url,
          publicId: asset.publicId,
          type: asset.resourceType === "video" ? "video" : "image",
        }));
      }

      const remainingExistingMedia = (editingMedia ?? []).filter(
        (media) => !existingMediaToDelete.has(media.id),
      );

      if (remainingExistingMedia.length > 0) {
        body.existingMedia = remainingExistingMedia.map((media) => ({
          id: media.id,
          url: media.url,
          type: media.type,
        }));
      }

      // Add media to delete
      if (existingMediaToDelete.size > 0) {
        body.deleteMediaIds = Array.from(existingMediaToDelete);
      }

      const response = await fetch(`/api/properties/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Status ${response.status}`);
      }

      const updated = payload?.data as PropertyRow | undefined;
      if (updated) {
        setListings((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
      }

      cancelEdit();
      setPendingAction(null);
      toast.success(locale === "ar" ? "تم حفظ العقار." : "Listing saved.");
    } catch (error) {
      setPendingAction(null);
      console.error("Failed to update listing:", error);
      toast.error(
        locale === "ar" ? "تعذر حفظ العقار." : "Could not save the listing.",
      );
    } finally {
      setLoading(false);
    }
  };

  const requestDelete = (item: PropertyRow) => {
    setPendingAction({ type: "delete", item });
  };

  const closeConfirm = () => {
    setPendingAction(null);
  };

  const confirmPendingAction = async () => {
    if (!pendingAction) return;
    if (pendingAction.type !== "delete" || !pendingAction.item) {
      return;
    }

    const item = pendingAction.item;

    setLoading(true);
    try {
      const response = await fetch(`/api/properties/${item.id}`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Status ${response.status}`);
      }

      setListings((current) =>
        current.filter((listing) => listing.id !== item.id),
      );

      if (editingId === item.id) {
        cancelEdit();
      }

      toast.success(locale === "ar" ? "تم حذف العقار." : "Listing deleted.");
    } catch (error) {
      console.error("Failed to delete listing:", error);
      toast.error(
        locale === "ar" ? "تعذر حذف العقار." : "Could not delete the listing.",
      );
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  const confirmTitle =
    pendingAction?.type === "save"
      ? locale === "ar"
        ? "تأكيد الحفظ"
        : "Confirm save"
      : locale === "ar"
        ? "تأكيد الحذف"
        : "Confirm delete";

  const confirmMessage =
    pendingAction?.type === "save"
      ? locale === "ar"
        ? `هل تريد حفظ العقار "${title.trim()}"؟`
        : `Save listing "${title.trim()}"?`
      : locale === "ar"
        ? `هل تريد حذف العقار "${pendingAction?.item?.title ?? ""}"؟`
        : `Delete listing "${pendingAction?.item?.title ?? ""}"?`;

  const confirmButtonLabel =
    pendingAction?.type === "save"
      ? locale === "ar"
        ? "حفظ"
        : "Save"
      : locale === "ar"
        ? "حذف"
        : "Delete";

  return (
    <div className="space-y-6">
      <Card className="border-border/70">
        <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>
            {locale === "ar" ? "العقارات الحالية" : "Current listings"}
          </CardTitle>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Input
              id="listing-search"
              placeholder={
                locale === "ar"
                  ? "ابحث عن عقار بالاسم..."
                  : "Search listings by name..."
              }
              value={currentSearch}
              onChange={(e) => updateSearch(e.target.value)}
            />
            <Select
              value={currentPageSize}
              onChange={(e) => updatePageSize(e.target.value)}
              className="w-20"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-150 text-left text-sm rtl:text-right">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border/70">
                <th className="pb-3 font-medium">
                  {locale === "ar" ? "العنوان" : "Title"}
                </th>
                <th className="pb-3 font-medium">
                  {locale === "ar" ? "المدينة" : "City"}
                </th>
                <th className="pb-3 font-medium">
                  {locale === "ar" ? "الحي" : "Neighborhood"}
                </th>
                <th className="pb-3 font-medium">
                  {locale === "ar" ? "السعر" : "Price"}
                </th>
                <th className="pb-3 font-medium">
                  {locale === "ar" ? "البائع" : "Seller"}
                </th>
                <th className="pb-3 font-medium">
                  {locale === "ar" ? "الحالة" : "Status"}
                </th>
                <th className="pb-3 font-medium">
                  {locale === "ar" ? "إجراء" : "Action"}
                </th>
              </tr>
            </thead>
            <tbody>
              {listings.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-4 text-center text-sm text-muted-foreground"
                  >
                    {locale === "ar"
                      ? "لا توجد عقارات بعد."
                      : "No listings found."}
                  </td>
                </tr>
              ) : (
                listings.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-4 font-medium">{item.title}</td>
                    <td className="py-4">{item.city}</td>
                    <td className="py-4">{item.neighborhood || "-"}</td>
                    <td className="py-4">{item.price}</td>
                    <td className="py-4">{item.seller.name || "-"}</td>
                    <td className="py-4">
                      <Badge variant={item.featured ? "accent" : "secondary"}>
                        {item.featured
                          ? locale === "ar"
                            ? "مميز"
                            : "Featured"
                          : locale === "ar"
                            ? "عادي"
                            : "Standard"}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <a
                        href={`/${locale}/properties/${item.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="ghost" className="gap-2">
                          <Eye className="h-4 w-4" />
                          {locale === "ar" ? "عرض" : "View"}
                        </Button>
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => requestEdit(item)}
                        className="gap-2"
                      >
                        <Edit3 className="h-4 w-4" />
                        {locale === "ar" ? "تعديل" : "Edit"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => requestDelete(item)}
                        className="ml-2 gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                        {locale === "ar" ? "حذف" : "Delete"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {listings.length > 0 && totalPages > 1 ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/70 px-3 py-2">
              <span className="text-xs text-muted-foreground">
                {locale === "ar" ? "الصفحة" : "Page"} {currentPage} /{" "}
                {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPageParam(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  {locale === "ar" ? "السابق" : "Previous"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPageParam(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  {locale === "ar" ? "التالي" : "Next"}
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {editingId && pendingAction?.type !== "delete" ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm"
          onClick={cancelEdit}
        >
          <div
            className="w-full max-h-[90vh] max-w-2xl overflow-y-auto rounded-3xl border border-border/70 bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Property Image */}
            <div className="relative h-64 w-full overflow-hidden rounded-t-3xl bg-muted">
              {heroMedia ? (
                <>
                  <Image
                    src={
                      "type" in heroMedia && heroMedia.type === "video"
                        ? getVideoThumbnailUrl(heroMedia.url)
                        : heroMedia.url
                    }
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
                  />
                  {"type" in heroMedia && heroMedia.type === "video" ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Video className="h-10 w-10 text-white" />
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="flex h-full items-center justify-center bg-linear-to-br from-muted to-muted-foreground/20 text-muted-foreground">
                  {locale === "ar" ? "بدون صورة" : "No image"}
                </div>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={cancelEdit}
                className="absolute right-4 top-4 gap-2 rounded-full bg-black/20 hover:bg-black/40"
              >
                <X className="h-5 w-5 text-white" />
              </Button>
            </div>

            {/* Property Info & Form */}
            <div className="space-y-6 p-6">
              {/* Property Details Summary */}
              <div>
                <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground mb-3">
                  {locale === "ar" ? "تعديل العقار" : "Edit listing"}
                </span>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {title}
                </h2>
                <p className="mt-2 text-muted-foreground">{description}</p>

                {/* Media Stats */}
                {editingMedia && editingMedia.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {editingMedia.filter((m) => m.type === "image").length >
                      0 && (
                      <span className="inline-flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400">
                        📷{" "}
                        {editingMedia.filter((m) => m.type === "image").length}
                        {locale === "ar" ? " صورة" : " Image"}
                        {editingMedia.filter((m) => m.type === "image").length >
                          1 && !locale.startsWith("ar")
                          ? "s"
                          : ""}
                      </span>
                    )}
                    {editingMedia.filter((m) => m.type === "video").length >
                      0 && (
                      <span className="inline-flex items-center gap-2 rounded-lg bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-600 dark:text-purple-400">
                        🎬{" "}
                        {editingMedia.filter((m) => m.type === "video").length}
                        {locale === "ar" ? " فيديو" : " Video"}
                        {editingMedia.filter((m) => m.type === "video").length >
                          1 && !locale.startsWith("ar")
                          ? "s"
                          : ""}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-border/70 bg-card/50 p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    {locale === "ar" ? "الغرف" : "ROOMS"}
                  </p>
                  <p className="mt-1 text-xl font-semibold">{rooms}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/50 p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    {locale === "ar" ? "الحمامات" : "BATHS"}
                  </p>
                  <p className="mt-1 text-xl font-semibold">{bathrooms || 0}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/50 p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    {locale === "ar" ? "المساحة" : "SQM"}
                  </p>
                  <p className="mt-1 text-xl font-semibold">{area || 0}</p>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {locale === "ar" ? "السعر الشهري" : "MONTHLY RENT"}
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {formatCurrency(Number(price), locale)}
                  </p>
                </div>
                <Badge variant={featured ? "accent" : "secondary"}>
                  {featured
                    ? locale === "ar"
                      ? "مميز"
                      : "Featured"
                    : locale === "ar"
                      ? "عادي"
                      : "Standard"}
                </Badge>
              </div>

              {/* Media Management */}
              <div className="space-y-4 border-t border-border/70 pt-6">
                <h3 className="text-sm font-semibold">
                  {locale === "ar"
                    ? "إدارة الصور والفيديوهات"
                    : "Media Management"}
                </h3>

                {/* Existing Media */}
                {editingMedia && editingMedia.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-medium text-muted-foreground">
                      {locale === "ar" ? "الملفات الحالية" : "Current media"}
                    </p>
                    <div className="grid gap-2 grid-cols-3 sm:grid-cols-4">
                      {editingMedia.map((media) => {
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
                                ? "border-border/30 opacity-50"
                                : "border-border"
                            }`}
                            style={{ aspectRatio: "1/1" }}
                          >
                            <Image
                              src={previewUrl}
                              alt="Property media"
                              fill
                              quality={80}
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {isVideo && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Video className="h-5 w-5 text-white" />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (isVideo) return;
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
                                      const nextCover =
                                        newImages.find(
                                          (asset) =>
                                            asset.resourceType !== "video",
                                        )?.url ??
                                        editingMedia.find(
                                          (m) =>
                                            m.id !== media.id &&
                                            !next.has(m.id) &&
                                            m.type !== "video",
                                        )?.url;
                                      setCoverUrl(nextCover);
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
                                  className="h-3 w-3"
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
                                <X className="h-3 w-3" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (isVideo) return;
                                setCoverUrl(media.url);
                              }}
                              className={`absolute bottom-1 ${locale === "ar" ? "right-1" : "left-1"} rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100`}
                            >
                              {isVideo ? (
                                <span>Video can&apos;t be cover</span>
                              ) : coverUrl === media.url ? (
                                <span className="inline-flex items-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-300" />
                                  Cover
                                </span>
                              ) : (
                                <span>Set cover</span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Upload new media */}
                {(editingMedia?.length ?? 0) +
                  newImages.length -
                  existingMediaToDelete.size <
                  10 && (
                  <div>
                    <p className="mb-3 text-xs font-medium text-muted-foreground">
                      {locale === "ar" ? "إضافة ملفات جديدة" : "Add new media"}
                    </p>
                    <label
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 text-center transition ${
                        uploading
                          ? "cursor-not-allowed border-border/50 bg-muted/10 opacity-60"
                          : dragOver
                            ? "border-violet-500 bg-violet-500/10"
                            : "border-border/80 bg-muted/20 hover:bg-muted/40"
                      }`}
                    >
                      {uploading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                      ) : (
                        <>
                          <ImagePlus className="h-5 w-5 text-violet-500" />
                          <span className="mt-2 text-xs font-medium text-muted-foreground">
                            {locale === "ar"
                              ? "اسحب أو انقر للرفع"
                              : "Drag or click to upload"}
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/*,video/*"
                        disabled={uploading}
                        onChange={(event) =>
                          void handleFiles(event.target.files)
                        }
                      />
                    </label>
                  </div>
                )}

                {/* Newly uploaded media */}
                {newImages.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-medium text-muted-foreground">
                      {locale === "ar" ? "ملفات جديدة" : "New uploads"}
                    </p>
                    <div className="grid gap-2 grid-cols-3 sm:grid-cols-4">
                      {newImages.map((asset, index) => {
                        const isVideo = asset.resourceType === "video";
                        const previewUrl = isVideo
                          ? getVideoThumbnailUrl(asset.url)
                          : asset.url;
                        return (
                          <div
                            key={`${index}-${asset.publicId}`}
                            className="relative group overflow-hidden rounded-lg border border-border"
                            style={{ aspectRatio: "1/1" }}
                          >
                            <Image
                              src={previewUrl}
                              alt="New upload"
                              fill
                              quality={80}
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {isVideo && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Video className="h-5 w-5 text-white" />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => void removeNewImage(index)}
                              className={`absolute top-1 ${locale === "ar" ? "left-1" : "right-1"} bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition z-10`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (isVideo) return;
                                setCoverUrl(asset.url);
                              }}
                              className={`absolute bottom-1 ${locale === "ar" ? "right-1" : "left-1"} rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100`}
                            >
                              {isVideo ? (
                                <span>Video can&apos;t be cover</span>
                              ) : coverUrl === asset.url ? (
                                <span className="inline-flex items-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-300" />
                                  Cover
                                </span>
                              ) : (
                                <span>Set cover</span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Edit Form */}
              <form
                onSubmit={openSaveConfirm}
                className="space-y-4 border-t border-border/70 pt-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="edit-title">
                    {locale === "ar" ? "العنوان" : "Title"}
                    <span className="ml-1 text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">
                    {locale === "ar" ? "الوصف" : "Description"}
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-city">
                      {locale === "ar" ? "المدينة" : "City"}
                      <span className="ml-1 text-red-500">*</span>
                    </Label>
                    <Select
                      id="edit-city"
                      value={city}
                      onChange={(e) => handleCityChange(e.target.value)}
                      required
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-neighborhood">
                      {locale === "ar" ? "الحي" : "Neighborhood"}
                      <span className="ml-1 text-red-500">*</span>
                    </Label>
                    <Select
                      id="edit-neighborhood"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      required
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
                    {city && availableNeighborhoods.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {locale === "ar"
                          ? "أضف الأحياء لهذه المدينة أولاً من لوحة الإدارة."
                          : "Add neighborhoods for this city from the admin dashboard first."}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-property-type">
                      {locale === "ar" ? "نوع العقار" : "Property type"}
                      <span className="ml-1 text-red-500">*</span>
                    </Label>
                    <Select
                      id="edit-property-type"
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      required
                    >
                      <option value="">
                        {locale === "ar"
                          ? "اختر النوع"
                          : "Select property type"}
                      </option>
                      {propertyTypes.map((pt) => (
                        <option key={pt.id} value={pt.id}>
                          {getLocalizedLabel(pt)}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-4 rounded-lg border border-border/70 bg-card/50 p-4 md:col-span-2">
                    <div>
                      <Label className="mb-3 block font-medium">
                        {locale === "ar" ? "نوع السعر" : "Price Type"}
                        <span className="ml-1 text-red-500">*</span>
                      </Label>
                      <div className="flex flex-wrap items-center gap-6">
                        {!forSale ? (
                          <>
                            <label className="flex cursor-pointer items-center gap-3">
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
                            <label className="flex cursor-pointer items-center gap-3">
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
                          </>
                        ) : (
                          <div className="text-sm font-medium text-muted-foreground">
                            {locale === "ar" ? "سعر البيع" : "Sale price"}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label
                        htmlFor="edit-price-input"
                        className="mb-2 block font-medium"
                      >
                        {forSale
                          ? locale === "ar"
                            ? "سعر البيع (د.م / MAD)"
                            : "Sale Price (MAD)"
                          : priceType === "MONTHLY"
                            ? locale === "ar"
                              ? "السعر الشهري (د.م / MAD)"
                              : "Monthly Price (MAD)"
                            : locale === "ar"
                              ? "السعر اليومي (د.م / MAD)"
                              : "Daily Price (MAD)"}
                        <span className="ml-1 text-red-500">*</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="edit-price-input"
                          type="number"
                          min={0}
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          required
                        />
                        {!forSale && (
                          <span className="whitespace-nowrap text-sm font-medium text-muted-foreground">
                            {priceType === "MONTHLY"
                              ? locale === "ar"
                                ? "/الشهر"
                                : "/month"
                              : locale === "ar"
                                ? "/اليوم"
                                : "/day"}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {locale === "ar"
                        ? "اختر نوع السعر أولاً، ثم أدخل القيمة المناسبة."
                        : "Choose the pricing type first, then enter the matching amount."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-rooms">
                      {locale === "ar" ? "الغرف" : "Rooms"}
                    </Label>
                    <Input
                      id="edit-rooms"
                      type="number"
                      min={1}
                      value={rooms}
                      onChange={(e) => setRooms(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-area">
                      {locale === "ar" ? "المساحة" : "Area"}
                    </Label>
                    <div className="relative">
                      <Input
                        id="edit-area"
                        type="number"
                        min={0}
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="pr-12"
                      />
                      <span
                        className={`absolute top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground ${
                          locale === "ar" ? "left-3" : "right-3"
                        }`}
                      >
                        m²
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-bathrooms">
                      {locale === "ar" ? "الحمامات" : "Bathrooms"}
                    </Label>
                    <Input
                      id="edit-bathrooms"
                      type="number"
                      min={0}
                      value={bathrooms}
                      onChange={(e) => setBathrooms(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2 flex items-end">
                    <div>
                      <Label className="mb-2 block font-medium">
                        {locale === "ar" ? "نوع العرض" : "Listing type"}
                      </Label>
                      <div className="flex items-center gap-4">
                        <label className="flex cursor-pointer items-center gap-3">
                          <input
                            type="radio"
                            name="listingType"
                            value="SALE"
                            checked={forSale === true}
                            onChange={() => setForSale(true)}
                            className="h-4 w-4 accent-violet-600"
                          />
                          <span className="text-sm font-medium">
                            {locale === "ar" ? "للبيع" : "Buy"}
                          </span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-3">
                          <input
                            type="radio"
                            name="listingType"
                            value="RENT"
                            checked={forSale === false}
                            onChange={() => setForSale(false)}
                            className="h-4 w-4 accent-violet-600"
                          />
                          <span className="text-sm font-medium">
                            {locale === "ar" ? "للايجار" : "Rent"}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="h-4 w-4"
                  />
                  {locale === "ar" ? "عقار مميز" : "Featured listing"}
                </label>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {locale === "ar" ? "حفظ" : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={cancelEdit}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    {locale === "ar" ? "إلغاء" : "Cancel"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {pendingAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border/70 bg-card p-6 shadow-2xl">
            <div
              className={
                pendingAction.type === "delete"
                  ? "mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400"
                  : "mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400"
              }
            >
              {pendingAction.type === "delete" ? (
                <Trash2 className="h-6 w-6" />
              ) : (
                <Edit3 className="h-6 w-6" />
              )}
            </div>

            <h2 className="text-2xl font-semibold tracking-tight">
              {confirmTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {confirmMessage}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={closeConfirm}
                className="gap-2"
                disabled={loading}
              >
                <X className="h-4 w-4" />
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                type="button"
                variant={pendingAction.type === "delete" ? "accent" : "default"}
                onClick={() => {
                  if (pendingAction.type === "save") {
                    void performSave();
                    return;
                  }

                  void confirmPendingAction();
                }}
                className="gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {locale === "ar" ? "جارٍ..." : "Processing..."}
                  </>
                ) : pendingAction.type === "delete" ? (
                  <>
                    <Trash2 className="h-4 w-4" />
                    {confirmButtonLabel}
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4" />
                    {confirmButtonLabel}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
