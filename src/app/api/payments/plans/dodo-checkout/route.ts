import { auth } from "@/auth";
import { getRequestBaseUrl } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { cancelSubscriptionInDodo } from "@/app/api/subscriptions/cancel/route";
import { NextRequest, NextResponse } from "next/server";
import type { Locale } from "@/lib/locales";

type DodoCheckoutRequest = {
  planId: string;
  locale?: Locale;
  paymentMethod?: string;
  cardholder?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  zip?: string;
  notes?: string;
  activationMode?: "immediate" | "scheduled";
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: DodoCheckoutRequest = await req.json();
    const { planId, cardholder, email, paymentMethod, activationMode, locale } =
      body;

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 },
      );
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const BASE_URL = getRequestBaseUrl(req.headers) ?? "http://localhost:3000";

    if (planId === "plan_free" || plan.price === 0) {
      if (activationMode === "scheduled") {
        // Schedule free plan for when current active subscription ends
        const existingActive = await prisma.subscription.findFirst({
          where: {
            userId: session.user.id,
            status: { in: ["ACTIVE", "WiLL_EXPIRE"] },
          },
          orderBy: { createdAt: "desc" },
        });

        let startDate = new Date();
        if (existingActive?.endDate) {
          startDate = new Date(existingActive.endDate);
        } else {
          // fallback: schedule 1 month from now
          startDate.setMonth(startDate.getMonth() + 1);
        }

        const scheduledEnd = new Date(startDate);
        scheduledEnd.setMonth(scheduledEnd.getMonth() + 1);

        await prisma.subscription.create({
          data: {
            userId: session.user.id,
            planId,
            status: "SCHEDULED",
            startDate,
            endDate: scheduledEnd,
            paymentId: null,
          },
        });

        return NextResponse.json({
          checkoutUrl: `${BASE_URL}/dashboard`,
          sessionId: null,
          message: "scheduled",
        });
      }

      const previousActiveSubscriptions = await prisma.subscription.findMany({
        where: {
          userId: session.user.id,
          status: { in: ["ACTIVE"] },
          dodoSubscriptionId: { not: null },
        },
        select: {
          id: true,
          dodoSubscriptionId: true,
        },
      });

      for (const previous of previousActiveSubscriptions) {
        if (!previous.dodoSubscriptionId) continue;

        try {
          await cancelSubscriptionInDodo(previous.dodoSubscriptionId);
          await prisma.subscription.update({
            where: { id: previous.id },
            data: { status: "CANCELLED" },
          });
        } catch (error) {
          console.error(
            "Failed to cancel previous Dodo subscription before free activation:",
            previous.id,
            error,
          );
        }
      }

      await prisma.subscription.updateMany({
        where: {
          userId: session.user.id,
          status: { in: ["ACTIVE", "WiLL_EXPIRE", "PENDING", "SCHEDULED"] },
        },
        data: { status: "DISABLED" },
      });

      const now = new Date();
      await prisma.subscription.create({
        data: {
          userId: session.user.id,
          planId,
          status: "ACTIVE",
          startDate: now,
          endDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 365),
          paymentId: null,
        },
      });

      await prisma.user.update({
        where: { id: session.user.id },
        data: { planId, status: "ACTIVE" },
      });

      return NextResponse.json({
        checkoutUrl: `${BASE_URL}/dashboard`,
        sessionId: null,
        message: "activated",
      });
    }

    const DODO_API_KEY = process.env.DODO_API_KEY;
    const DODO_PRODUCT_ID = (() => {
      if (planId === "plan_pro") return process.env.DODO_PRODUCT_ID_PRO_PLAN;
      if (planId === "plan_premium")
        return process.env.DODO_PRODUCT_ID_PREMIUM_PLAN;
      return process.env.DODO_PRODUCT_ID;
    })();

    const DODO_API_BASE_URL =
      process.env.DODO_API_BASE_URL ??
      (process.env.NODE_ENV === "development"
        ? "https://test.dodopayments.com"
        : "https://live.dodopayments.com");

    if (!DODO_API_KEY || !DODO_PRODUCT_ID) {
      return NextResponse.json(
        { error: "Dodo configuration is missing" },
        { status: 500 },
      );
    }

    const customerEmail = email || session.user.email;
    const customerName = cardholder || session.user.name || "Customer";

    // Generate a local session id so we can show a session token on
    // the return page regardless of Dodo's own redirect params.
    const localSessionId =
      typeof globalThis.crypto?.randomUUID === "function"
        ? globalThis.crypto.randomUUID()
        : `local_${Date.now()}`;

    const safeLocale: Locale =
      locale === "ar" || locale === "fr" ? locale : "en";

    const returnUrlWithSession = `${BASE_URL}/${safeLocale}/payments/success?session=${encodeURIComponent(
      localSessionId,
    )}`;

    const checkoutPayload = {
      price: { tax_inclusive: true },
      product_cart: [{ product_id: DODO_PRODUCT_ID, quantity: 1 }],
      customer: { email: customerEmail, name: customerName },
      billing_currency: "MAD",
      metadata: {
        userId: session.user.id,
        planId,
        productId: DODO_PRODUCT_ID,
        userEmail: customerEmail,
        paymentMethod,
        activationMode: activationMode || "immediate",
        locale: safeLocale,
        localSessionId,
      },
      return_url: returnUrlWithSession,
      cancel_url: `${BASE_URL}/${safeLocale}/pricing`,
    };

    const dodoResponse = await fetch(`${DODO_API_BASE_URL}/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DODO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkoutPayload),
    });

    if (!dodoResponse.ok) {
      const errorData = await dodoResponse.json();
      console.error("Dodo checkout error:", errorData);
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 },
      );
    }
    const checkoutSession = await dodoResponse.json();
    return NextResponse.json({
      checkoutUrl: checkoutSession.checkout_url || checkoutSession.url,
      // Return our local session id so the client can show/follow it if needed
      sessionId: localSessionId,
      checkoutId: checkoutSession.id,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
