import { prisma } from "@/lib/prisma";
import { Prisma, SubscriptionStatus } from "@/generated/prisma/client";
import { Webhooks } from "@dodopayments/nextjs";
import { cancelSubscriptionInDodo } from "@/app/api/subscriptions/cancel/route";
import { ensurePlan } from "@/lib/ensure-plan";

type DodoWebhookData = {
  customer?: {
    email?: string | null;
    name?: string | null;
  } | null;
  cancel_at_next_billing_date?: boolean;
  subscription_id?: string | null;
  metadata?: {
    productId?: string | null;
    userId?: string | null;
    userName?: string | null;
    userEmail?: string | null;
    activationMode?: string | null;
    paymentId?: string | null;
    subscriptionId?: string | null;
    localSessionId?: string | null;
    local_session_id?: string | null;
  } | null;
  product_cart?: Array<{
    product_id?: string | null;
  }>;
  payment_id?: string | null;
  status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

function isSubscriptionStatus(value: string): value is SubscriptionStatus {
  return (Object.values(SubscriptionStatus) as string[]).includes(value);
}

// Map Dodo product IDs to internal plan IDs
function mapProductToPlan(productId?: string | null): string | null {
  const proProductId = process.env.DODO_PRODUCT_ID_PRO_PLAN;
  const premiumProductId = process.env.DODO_PRODUCT_ID_PREMIUM_PLAN;

  if (!productId) return null;

  if (productId === proProductId) return "plan_pro";

  if (productId === premiumProductId) return "plan_premium";

  return null;
}

// Add subscription duration
function getPlanEndDate(planId: string) {
  const endDate = new Date();

  switch (planId) {
    case "plan_pro":
      endDate.setMonth(endDate.getMonth() + 1);

      break;

    case "plan_premium":
      endDate.setMonth(endDate.getMonth() + 1);

      break;

    default:
      endDate.setMonth(endDate.getMonth() + 1);

      break;
  }

  return endDate;
}

export const POST = Webhooks({
  webhookKey:
    process.env.DODO_PAYMENTS_WEBHOOK_SECRET ??
    process.env.DODO_WEBHOOK_SECRET ??
    "",

  onPaymentSucceeded: async (payload) => {
    try {
      const customerName =
        payload.data?.customer?.name ??
        payload.data?.metadata?.userName ??
        null;
      const productId =
        payload.data?.metadata?.productId ??
        payload.data?.product_cart?.[0]?.product_id;

      const planId = mapProductToPlan(productId);

      const paymentId = payload.data?.payment_id;
      const dodoSubscriptionId = payload.data?.subscription_id ?? null;

      const metadataUserId = payload.data?.metadata?.userId;

      const customerEmail =
        payload.data?.customer?.email ?? payload.data?.metadata?.userEmail;

      const activationMode =
        payload.data?.metadata?.activationMode ?? "immediate";

      const localSessionId =
        payload.data?.metadata?.localSessionId ??
        payload.data?.metadata?.local_session_id ??
        null;

      if (!planId) {
        console.error("Unknown Dodo product ID:", productId);
        return;
      }

      // Find user
      let user = null;

      if (metadataUserId) {
        user = await prisma.user.findUnique({
          where: {
            id: metadataUserId,
          },
        });
      }

      // fallback to email
      if (!user && customerEmail) {
        user = await prisma.user.findUnique({
          where: {
            email: customerEmail,
          },
        });
      }

      if (!user) {
        console.error("No user found for Dodo customer:", customerEmail);
        return;
      }

      // Persist customer name if available and user has no name
      if (customerName && !user.name) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { name: customerName },
          });
        } catch (e) {
          console.error(
            "Failed to persist customer name for user:",
            user.id,
            e,
          );
        }
      }

      const startDate = new Date();
      let endDate = getPlanEndDate(planId);
      let subscriptionStatus: "ACTIVE" | "SCHEDULED" = "ACTIVE";

      // Ensure the plan exists in DB to avoid foreign key errors when
      // assigning `planId` to `User` or creating Subscription rows.
      try {
        await ensurePlan(planId);
      } catch (e) {
        console.error("Failed to ensure plan exists:", planId, e);
      }

      // If scheduled mode, check if user has active subscription
      if (activationMode === "scheduled") {
        const existingActiveSubscription = await prisma.subscription.findFirst({
          where: {
            userId: user.id,
            status: { in: ["ACTIVE", "WiLL_EXPIRE"] },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        if (existingActiveSubscription?.endDate) {
          // Schedule for when current subscription expires
          const scheduledStart = new Date(existingActiveSubscription.endDate);
          const scheduledEnd = new Date(scheduledStart);
          scheduledEnd.setMonth(scheduledEnd.getMonth() + 1);

          startDate.setTime(scheduledStart.getTime());
          endDate = scheduledEnd;
          subscriptionStatus = "SCHEDULED";
        }
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { planId, status: "ACTIVE" },
        });
      }

      let currentSubscriptionId: string | null = null;
      if (subscriptionStatus === "SCHEDULED") {
        const createdSubscription = await prisma.subscription.create({
          data: {
            userId: user.id,
            planId,
            status: subscriptionStatus,
            paymentId,
            dodoSubscriptionId,
            localSessionId: localSessionId ?? undefined,
            startDate,
            endDate,
          },
        });
        currentSubscriptionId = createdSubscription.id;
      } else {
        const createdSubscription = await prisma.subscription.create({
          data: {
            userId: user.id,
            planId,
            status: subscriptionStatus,
            paymentId,
            dodoSubscriptionId,
            localSessionId: localSessionId ?? undefined,
            startDate,
            endDate,
          },
        });
        currentSubscriptionId = createdSubscription.id;
      }

      if (currentSubscriptionId && subscriptionStatus === "ACTIVE") {
        const previousActiveSubscriptions = await prisma.subscription.findMany({
          where: {
            userId: user.id,
            id: { not: currentSubscriptionId },
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
          } catch (error) {
            console.error(
              "Failed to cancel previous Dodo subscription during immediate activation:",
              previous.id,
              error,
            );
          }
        }

        await prisma.subscription.updateMany({
          where: {
            userId: user.id,
            id: { not: currentSubscriptionId },
          },
          data: {
            status: "DISABLED",
          },
        });
      }
    } catch (error) {
      console.error("Error handling payment succeeded webhook:", error);
    }
  },

  // PAYMENT FAILED
  onPaymentFailed: async (payload) => {
    try {
      const customerEmail = payload.data?.customer?.email;
      const customerName =
        payload.data?.customer?.name ??
        payload.data?.metadata?.userName ??
        null;

      if (!customerEmail) return;

      const user = await prisma.user.findUnique({
        where: {
          email: customerEmail,
        },
      });

      if (!user) return;

      if (customerName && !user.name) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { name: customerName },
          });
        } catch (e) {
          console.error(
            "Failed to persist customer name for user:",
            user.id,
            e,
          );
        }
      }

      await prisma.subscription.updateMany({
        where: {
          userId: user.id,
        },
        data: {
          status: "PENDING",
        },
      });
    } catch (error) {
      console.error("Error handling payment failed webhook:", error);
    }
  },

  // SUBSCRIPTION CANCELLED
  onSubscriptionCancelled: async (payload) => {
    try {
      const customerEmail = payload.data?.customer?.email;
      const customerName = payload.data?.customer?.name ?? null;
      const dodoSubscriptionId = payload.data?.subscription_id;

      if (!customerEmail) return;

      const user = await prisma.user.findUnique({
        where: {
          email: customerEmail,
        },
      });

      if (!user) return;

      if (customerName && !user.name) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { name: customerName },
          });
        } catch (e) {
          console.error(
            "Failed to persist customer name for user:",
            user.id,
            e,
          );
        }
      }

      // cancel subscription
      await prisma.subscription.updateMany({
        where: {
          userId: user.id,
        },
        data: {
          status: "CANCELLED",
        },
      });

      if (dodoSubscriptionId) {
        await prisma.subscription.updateMany({
          where: { dodoSubscriptionId },
          data: { status: "CANCELLED" },
        });
      }
    } catch (error) {
      console.error("Error handling cancellation webhook:", error);
    }
  },
  // SUBSCRIPTION UPDATED
  onSubscriptionUpdated: async (payload) => {
    try {
      const data = (payload.data ?? {}) as DodoWebhookData;
      const customerName =
        data?.customer?.name ?? data?.metadata?.userName ?? null;
      const customerEmail = data?.customer?.email ?? data?.metadata?.userEmail;
      if (!customerEmail) return;

      const user = await prisma.user.findUnique({
        where: { email: customerEmail },
      });
      if (!user) return;

      if (customerName && !user.name) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { name: customerName },
          });
        } catch (e) {
          console.error(
            "Failed to persist customer name for user:",
            user.id,
            e,
          );
        }
      }

      const dodoSubscriptionId =
        data?.subscription_id ?? data?.metadata?.subscriptionId;

      const parseStatus = (
        s?: string | null,
      ): SubscriptionStatus | undefined => {
        if (!s) return undefined;
        const up = s.toUpperCase();
        return isSubscriptionStatus(up) ? up : undefined;
      };

      const updates: Prisma.SubscriptionUpdateManyMutationInput = {};
      const parsedStatus = parseStatus(data?.status);
      if (parsedStatus) updates.status = parsedStatus;
      if (data?.start_date) updates.startDate = new Date(data.start_date);
      if (data?.end_date) updates.endDate = new Date(data.end_date);

      if (dodoSubscriptionId && data.cancel_at_next_billing_date) {
        await prisma.subscription.updateMany({
          where: { dodoSubscriptionId },
          data: { status: "WiLL_EXPIRE" },
        });
      } else if (dodoSubscriptionId) {
        await prisma.subscription.updateMany({
          where: { dodoSubscriptionId },
          data: updates,
        });
      }
    } catch (error) {
      console.error("Error handling subscription updated webhook:", error);
    }
  },

  // SUBSCRIPTION EXPIRED / ENDED
  onSubscriptionExpired: async (payload) => {
    try {
      const data = (payload.data ?? {}) as DodoWebhookData;
      const customerEmail = data?.customer?.email ?? data?.metadata?.userEmail;
      const customerName =
        data?.customer?.name ?? data?.metadata?.userName ?? null;
      const expiredAt = data?.end_date ? new Date(data.end_date) : null;

      if (!customerEmail) return;
      const user = await prisma.user.findUnique({
        where: { email: customerEmail },
      });
      if (!user) return;

      if (customerName && !user.name) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { name: customerName },
          });
        } catch (e) {
          console.error(
            "Failed to persist customer name for user:",
            user.id,
            e,
          );
        }
      }

      // Ignore premature expiration callbacks until the actual end date.
      if (expiredAt && expiredAt > new Date()) {
        console.log(
          "Ignoring early subscription expired webhook until end date:",
          expiredAt.toISOString(),
        );
        return;
      }

      await prisma.subscription.updateMany({
        where: {
          userId: user.id,
          status: { in: ["ACTIVE", "WiLL_EXPIRE", "PENDING"] },
        },
        data: {
          status: "EXPIRED",
          dodoSubscriptionId: data?.subscription_id ?? undefined,
        },
      });
    } catch (error) {
      console.error("Error handling subscription expired webhook:", error);
    }
  },

  // PAYMENT REFUNDED
  onRefundSucceeded: async (payload) => {
    try {
      const data = payload.data ?? {};

      const customerEmail = data?.customer?.email ?? data?.metadata?.userEmail;

      const customerName =
        data?.customer?.name ?? data?.metadata?.userName ?? null;

      if (!customerEmail) return;

      const user = await prisma.user.findUnique({
        where: { email: customerEmail },
      });

      if (!user) return;

      if (customerName && !user.name) {
        await prisma.user.update({
          where: { id: user.id },
          data: { name: customerName },
        });
      }

      const paymentId = data?.payment_id ?? data?.metadata?.paymentId;

      const subscriptionId = data?.metadata?.subscriptionId;

      const isPartialRefund = Boolean(data?.is_partial);

      if (isPartialRefund) {
        console.log("Partial refund → no subscription change");
        return;
      }

      if (paymentId) {
        await prisma.subscription.updateMany({
          where: { paymentId },
          data: { status: "CANCELLED" },
        });
      }

      // Cancel by subscriptionId
      if (subscriptionId) {
        await prisma.subscription.updateMany({
          where: { dodoSubscriptionId: subscriptionId },
          data: { status: "CANCELLED" },
        });
      }

      console.log("Refund processed successfully for:", customerEmail);
    } catch (error) {
      console.error("Error handling refund webhook:", error);
    }
  },
});
