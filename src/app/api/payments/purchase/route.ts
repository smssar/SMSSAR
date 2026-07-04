import { auth } from "@/auth";
import { getRequestBaseUrl } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";
import type { Locale } from "@/lib/locales";
import { prisma } from "@/lib/prisma";
import { resolvePurchaseProductPrice } from "@/lib/role-pricing";

// ---------------------------------------------------------------------------
// Request / Response types
// ---------------------------------------------------------------------------

const VALID_PURCHASE_TYPES = new Set([
  "ADSNUMBERS",
  "EXTRA_IMAGES",
  "ADS_DURATION_PER_DAY",
  "EXTRA_VIDEOS",
  "EXTRA_LISTINGS",
  "EXTRA_FEATURED_LISTINGS",
] as const);

type PurchaseType =
  typeof VALID_PURCHASE_TYPES extends Set<infer T> ? T : never;

type PurchaseItem = {
  type: PurchaseType;
  quantity: number;
};

type PurchaseCheckoutRequest = {
  amount?: number | string;
  locale?: Locale;
  purchases?: PurchaseItem[];
  returnTo?: string;
  email?: string;
  // kept for future use — not sent to Dodo
  productId?: string;
  purchaseType?: string;
  productName?: string;
  propertyId?: string;
  paymentMethod?: string;
  notes?: string;
  selectedProductIds?: string[];
  selectedProductNames?: string[];
};

// Dodo metadata values must all be primitives — no arrays or nested objects
type DodoMetadata = {
  userId: string;
  purchases?: string; // JSON.stringify(PurchaseItem[])
  locale: Locale;
  localSessionId: string;
  amount?: string; // MUST be string
  userEmail?: string;
  userRole?: string;
};

type CheckoutPayload = {
  price: { tax_inclusive: boolean };
  product_cart: Array<{
    product_id: string;
    quantity: number;
    amount?: number;
  }>;
  customer: { email?: string; name: string };
  billing_currency: string;
  metadata: DodoMetadata;
  return_url: string;
  cancel_url: string;
};

type DodoCheckoutResponse = {
  checkout_url?: string;
  url?: string;
  id?: string;
};

function validatePurchases(
  raw: unknown[] | undefined,
): PurchaseItem[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;

  const valid = raw.filter(
    (p): p is PurchaseItem =>
      p !== null &&
      typeof p === "object" &&
      VALID_PURCHASE_TYPES.has((p as PurchaseItem).type) &&
      Number.isInteger((p as PurchaseItem).quantity) &&
      (p as PurchaseItem).quantity > 0,
  );

  return valid.length > 0 ? valid : undefined;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: PurchaseCheckoutRequest = await req.json();

    const { purchases: rawPurchases, amount, locale, email } = body;
    const safeLocale: Locale =
      locale === "ar" || locale === "fr" ? locale : "en";

    const purchases = validatePurchases(rawPurchases);

    const baseUrl = getRequestBaseUrl(req.headers);
    if (!baseUrl && process.env.NODE_ENV === "production") {
      console.error("Could not determine base URL from request headers");
      return NextResponse.json(
        { error: "Could not determine base URL" },
        { status: 500 },
      );
    }

    const products = await prisma.purchaseProduct.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
    });

    let calculatedTotal = 0;

    if (purchases && purchases.length > 0) {
      for (const purchase of purchases) {
        const product = products.find((p) => p.code === purchase.type);
        if (!product) {
          console.error("Invalid purchase type:", purchase.type);
          return NextResponse.json(
            { error: `Invalid purchase type: ${purchase.type}` },
            { status: 400 },
          );
        }
        calculatedTotal +=
          resolvePurchaseProductPrice(product, session.user.role) *
          purchase.quantity;
      }

      if (amount !== undefined) {
        const amountNumber =
          typeof amount === "string" ? Number(amount) : amount;
        if (
          typeof amountNumber !== "number" ||
          Number.isNaN(amountNumber) ||
          Math.abs(calculatedTotal - amountNumber) > 0.01
        ) {
          console.error(
            "Amount mismatch:",
            "calculated total is",
            calculatedTotal,
            "but received",
            amount,
          );
          return NextResponse.json(
            { error: "Amount does not match purchases" },
            { status: 400 },
          );
        }
      }
    }

    const resolvedBaseUrl = baseUrl ?? "http://localhost:3000";

    const DODO_API_KEY = process.env.DODO_API_KEY;
    const DODO_PRODUCT_ID = process.env.DODO_PRODUCT_ID_PURCHASE;

    const resolvedDodoBase =
      process.env.DODO_API_BASE_URL ??
      (process.env.DODO_MODE === "test"
        ? "https://test.dodopayments.com"
        : "https://live.dodopayments.com");

    if (
      (resolvedDodoBase.includes("localhost") ||
        resolvedDodoBase.includes("127.0.0.1")) &&
      process.env.NODE_ENV !== "development"
    ) {
      console.error(
        "Invalid DODO_API_BASE_URL in production:",
        resolvedDodoBase,
      );
      return NextResponse.json(
        { error: "Dodo API base is misconfigured" },
        { status: 500 },
      );
    }

    if (!DODO_API_KEY || !DODO_PRODUCT_ID) {
      console.error(
        "Missing Dodo env vars: DODO_API_KEY or DODO_PRODUCT_ID_PURCHASE",
      );
      return NextResponse.json(
        { error: "Dodo configuration is missing" },
        { status: 500 },
      );
    }

    const customerEmail = email || session.user.email || undefined;
    const customerName = session.user.name || "Customer";

    const localSessionId =
      typeof globalThis.crypto?.randomUUID === "function"
        ? globalThis.crypto.randomUUID()
        : `local_${Date.now()}`;

    const returnUrl = `${resolvedBaseUrl}/${safeLocale}/payments/success?session=${encodeURIComponent(localSessionId)}`;
    const cancelUrl = `${resolvedBaseUrl}/${safeLocale}/dashboard/seller`;

    const checkoutPayload: CheckoutPayload = {
      price: { tax_inclusive: true },
      product_cart: [
        {
          product_id: DODO_PRODUCT_ID,
          quantity: 1,
          amount: calculatedTotal * 10,
        },
      ],
      customer: { email: customerEmail, name: customerName },
      billing_currency: process.env.BILLING_CURRENCY ?? "MAD",
      metadata: {
        userId: session.user.id,
        purchases: purchases ? JSON.stringify(purchases) : undefined,
        locale: safeLocale,
        localSessionId,
        amount: String(calculatedTotal),
        userRole: session.user.role,
        userEmail: customerEmail,
      },
      return_url: returnUrl,
      cancel_url: cancelUrl,
    };

    const dodoResponse = await fetch(`${resolvedDodoBase}/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DODO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkoutPayload),
    });

    if (!dodoResponse.ok) {
      const errorData = await dodoResponse.json().catch(() => null);
      console.error("Dodo checkout error (purchase):", errorData);
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 },
      );
    }

    const checkoutSession: DodoCheckoutResponse = await dodoResponse.json();

    return NextResponse.json({
      checkoutUrl: checkoutSession.checkout_url || checkoutSession.url,
      sessionId: localSessionId,
      checkoutId: checkoutSession.id,
    });
  } catch (error) {
    console.error("Purchase checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
