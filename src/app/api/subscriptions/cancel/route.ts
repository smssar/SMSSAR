import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSubscription } from "@/lib/getActiveSubscription";

const DODO_BASE =
  process.env.DODO_API_BASE_URL ??
  (process.env.DODO_MODE === "test"
    ? "https://test.dodopayments.com"
    : "https://live.dodopayments.com");

export async function cancelSubscriptionInDodo(subscriptionId: string) {
  const apiKey = process.env.DODO_API_KEY;

  if (!apiKey) {
    throw new Error("DODO_API_KEY is not set");
  }

  const url = `${DODO_BASE}/subscriptions/${subscriptionId}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cancel_at_next_billing_date: true,
      cancel_reason: "cancelled_by_customer",
    }),
  });

  if (response.ok) {
    return;
  }

  const text = await response.text();

  throw new Error(`Dodo cancellation failed (${response.status}): ${text}`);
}

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await getActiveSubscription(session.user.id);

    if (!subscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 },
      );
    }

    if (!subscription.dodoSubscriptionId) {
      return NextResponse.json(
        {
          error: "Missing Dodo subscription ID",
          detail:
            "Subscription does not have a Dodo subscription ID. Please ensure the payment webhook has been processed.",
        },
        { status: 400 },
      );
    }

    await cancelSubscriptionInDodo(subscription.dodoSubscriptionId);
    await prisma.subscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        status: "WiLL_EXPIRE",
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Subscription CANCELLED successfully. Your plan remains active until the end date.",
      endDate: subscription.endDate,
    });
  } catch (error) {
    console.error("[Cancel Subscription] Error:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (
      message.includes("DODO_API_KEY") ||
      message.toLowerCase().includes("dodo")
    ) {
      return NextResponse.json(
        {
          error: "Failed to cancel subscription in Dodo",
          detail: message,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
