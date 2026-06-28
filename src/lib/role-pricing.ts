type RoleLike = "USER" | "SELLER" | "ADMIN" | "SMSSAR" | null | undefined;

type PlanLike = {
  price: number;
  smmsarPrice?: number | null;
  listings?: number | null;
  smssarListings?: number | null;
  maxFeaturedListings?: number | null;
  smssarMaxFeaturedListings?: number | null;
  maxImagesPerListing?: number | null;
  smssarMaxImagesPerListing?: number | null;
  maxVideosPerListing?: number | null;
  smssarMaxVideosPerListing?: number | null;
};

type PurchaseProductLike = {
  price: number;
  smmsarPrice?: number | null;
};

const isSmssar = (role: RoleLike) => role === "SMSSAR";

const pickValue = (
  baseValue: number | null | undefined,
  smssarValue: number | null | undefined,
  role: RoleLike,
) =>
  isSmssar(role) ? (smssarValue ?? baseValue ?? null) : (baseValue ?? null);

export function resolvePlanForRole<T extends PlanLike | null | undefined>(
  plan: T,
  role: RoleLike,
): T extends null | undefined ? null : T & PlanLike {
  if (!plan) return null as T extends null | undefined ? null : T & PlanLike;

  return {
    ...plan,
    price: isSmssar(role) ? (plan.smmsarPrice ?? plan.price) : plan.price,
    listings: pickValue(plan.listings, plan.smssarListings, role),
    maxFeaturedListings: pickValue(
      plan.maxFeaturedListings,
      plan.smssarMaxFeaturedListings,
      role,
    ),
    maxImagesPerListing: pickValue(
      plan.maxImagesPerListing,
      plan.smssarMaxImagesPerListing,
      role,
    ),
    maxVideosPerListing: pickValue(
      plan.maxVideosPerListing,
      plan.smssarMaxVideosPerListing,
      role,
    ),
  } as T extends null | undefined ? null : T & PlanLike;
}

export function resolvePurchaseProductPrice(
  product: PurchaseProductLike,
  role: RoleLike,
) {
  return isSmssar(role)
    ? (product.smmsarPrice ?? product.price)
    : product.price;
}
