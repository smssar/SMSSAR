import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { SubscriptionStatus } from "@/generated/prisma/client";

type RefundRequest = {
  paymentId?: string;
  subscriptionId?: string;
  reason?: string;
  partialAmount?: number;
};

const REFUNDABLE_STATUSES: SubscriptionStatus[] = [
  "ACTIVE",
  "WiLL_EXPIRE",
  "SCHEDULED",
];

function mapPlanToProductId(planId?: string | null) {
  const proProductId = process.env.DODO_PRODUCT_ID_PRO_PLAN;
  const premiumProductId = process.env.DODO_PRODUCT_ID_PREMIUM_PLAN;

  switch (planId) {
    case "plan_pro":
      return proProductId ?? null;
    case "plan_premium":
      return premiumProductId ?? null;
    default:
      return null;
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: RefundRequest = await req.json();
    const { subscriptionId, reason, partialAmount } = body;
    let paymentId = body.paymentId;
    let subscription: {
      id: string;
      status: SubscriptionStatus;
      planId: string;
      paymentId: string | null;
    } | null = null;

    if (!paymentId && !subscriptionId) {
      return NextResponse.json(
        { error: "paymentId or subscriptionId required" },
        { status: 400 },
      );
    }

    if (subscriptionId) {
      subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        select: {
          id: true,
          status: true,
          planId: true,
          paymentId: true,
        },
      });

      if (!subscription?.paymentId) {
        return NextResponse.json(
          { error: "Subscription or payment not found" },
          { status: 404 },
        );
      }

      if (!REFUNDABLE_STATUSES.includes(subscription.status)) {
        return NextResponse.json(
          {
            error:
              "Refunds are only allowed for ACTIVE, WiLL_EXPIRE, or SCHEDULED subscriptions",
          },
          { status: 400 },
        );
      }

      if (!paymentId) {
        paymentId = subscription.paymentId;
      }
    }

    const DODO_API_KEY = process.env.DODO_API_KEY;
    const resolvedDodoBase =
      process.env.DODO_API_BASE_URL ??
      (process.env.DODO_MODE === "test"
        ? "https://test.dodopayments.com"
        : "https://live.dodopayments.com");

    if (!DODO_API_KEY) {
      console.error("DODO_API_KEY missing in environment");
      return NextResponse.json(
        { error: "Dodo API key missing" },
        { status: 502 },
      );
    }

    const refundUrl = `${resolvedDodoBase}/refunds`;

    const refundBody: {
      payment_id: string;
      reason: string;
      items?: Array<{
        item_id: string;
        amount?: number | null;
        tax_inclusive?: boolean;
      }>;
    } = {
      payment_id: paymentId!,
      reason: reason ?? "admin_refund",
    };

    if (partialAmount !== undefined && partialAmount !== null) {
      if (partialAmount <= 0) {
        return NextResponse.json(
          { error: "Partial amount must be greater than 0" },
          { status: 400 },
        );
      }

      const productId = mapPlanToProductId(subscription?.planId);

      if (!productId) {
        return NextResponse.json(
          { error: "Unable to determine Dodo product for partial refund" },
          { status: 400 },
        );
      }

      refundBody.items = [
        {
          item_id: productId,
          amount: partialAmount,
          tax_inclusive: true,
        },
      ];
    }

    let resp;
    try {
      resp = await fetch(refundUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DODO_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(refundBody),
      });
    } catch (err) {
      console.error("Dodo refund request failed:", err);
      return NextResponse.json(
        {
          error: "Dodo request failed",
          detail: err instanceof Error ? err.message : String(err),
        },
        { status: 502 },
      );
    }

    const raw = await resp.text();
    let data = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = raw;
    }

    if (!resp.ok) {
      console.error("Dodo refund failed", { status: resp.status, body: data });
      return NextResponse.json(
        { error: "Refund failed", status: resp.status, detail: data },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, refund: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json(
      { error: "Internal server error", detail: message },
      { status: 500 },
    );
  }
}
