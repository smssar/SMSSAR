import { prisma } from "@/lib/prisma";
import { Prisma, SubscriptionStatus } from "@/generated/prisma/client";
import { Webhooks } from "@dodopayments/nextjs";
import { cancelSubscriptionInDodo } from "@/app/api/subscriptions/cancel/route";
import { ensurePlan } from "@/lib/ensure-plan";
import { sendBillingEmail } from "@/lib/billing-email";
import type { Locale } from "@/lib/locales";

type DodoWebhookData = {
  customer?: {
    email?: string | null;
    name?: string | null;
  } | null;
  cancel_at_next_billing_date?: boolean;
  subscription_id?: string | null;
  metadata?: {
    amount?: number | string | null;
    productId?: string | null;
    userId?: string | null;
    userName?: string | null;
    userEmail?: string | null;
    locale?: string | null;
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
  total_amount?: number | string | null;
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

function resolveEmailLocale(value?: string | null): Locale {
  return value === "ar" || value === "fr" ? value : "en";
}

function resolveMetadataAmount(value?: number | string | null) {
  if (value === null || value === undefined) return undefined;
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(parsed) ? parsed : undefined;
}

function datesEqual(a?: Date | null, b?: Date | null) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.getTime() === b.getTime();
}

async function sendBillingNotification(params: {
  to?: string | null;
  locale?: string | null;
  kind:
    | "payment_succeeded"
    | "subscription_scheduled"
    | "subscription_cancelled"
    | "refund_succeeded";
  userName?: string | null;
  planId?: string | null;
  price?: number | null;
  subscriptionId?: string | null;
  paymentId?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  purchaseDate?: Date | string | null;
  createdAt?: Date | string | null;
}) {
  try {
    if (!params.to) return;

    const locale = resolveEmailLocale(params.locale);
    const planRecord = params.planId
      ? await prisma.plan.findUnique({
          where: { id: params.planId },
        })
      : null;

    const subscriptionRecord =
      !planRecord && (params.subscriptionId || params.paymentId)
        ? await prisma.subscription.findFirst({
            where: params.subscriptionId
              ? { dodoSubscriptionId: params.subscriptionId }
              : { paymentId: params.paymentId ?? undefined },
            include: { plan: true },
            orderBy: { createdAt: "desc" },
          })
        : null;

    const plan = planRecord ?? subscriptionRecord?.plan ?? null;

    const planTitle = plan
      ? locale === "ar"
        ? (plan.title_ar ?? plan.title)
        : locale === "fr"
          ? (plan.title_fr ?? plan.title)
          : plan.title
      : null;

    await sendBillingEmail({
      to: params.to,
      locale,
      kind: params.kind,
      userName: params.userName,
      planTitle,
      planPrice: params.price ?? (plan?.price ? plan?.price * 100 : null),
      currency: "MAD",
      startDate: params.startDate ?? undefined,
      endDate: params.endDate ?? undefined,
      paymentId: params.paymentId ?? undefined,
      purchaseDate: params.purchaseDate ?? undefined,
      createdAt: params.createdAt ?? undefined,
    });
  } catch (error) {
    console.error("Failed to send billing email:", error);
  }
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

      // Idempotency guard: Dodo webhooks are at-least-once delivery.
      // If this payment was already processed, skip duplicate side effects.
      if (paymentId) {
        const alreadyProcessed = await prisma.subscription.findFirst({
          where: { paymentId },
          select: { id: true },
        });

        if (alreadyProcessed) {
          console.log(
            "Duplicate payment.succeeded webhook ignored:",
            paymentId,
          );
          return;
        }
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
      let subscriptionCreatedAt: Date | null = null;

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

      // Check if subscription with this paymentId already exists
      const existingPayment = paymentId
        ? await prisma.subscription.findFirst({
            where: { paymentId },
            select: { id: true, createdAt: true },
          })
        : null;

      if (existingPayment) {
        currentSubscriptionId = existingPayment.id;
        subscriptionCreatedAt = existingPayment.createdAt;
      } else if (subscriptionStatus === "SCHEDULED") {
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
        subscriptionCreatedAt = createdSubscription.createdAt;
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
        subscriptionCreatedAt = createdSubscription.createdAt;
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

      await sendBillingNotification({
        to: customerEmail,
        locale: payload.data?.metadata?.locale,
        kind:
          subscriptionStatus === "SCHEDULED"
            ? "subscription_scheduled"
            : "payment_succeeded",
        userName: user.name,
        planId,
        price: resolveMetadataAmount(payload.data?.total_amount),
        paymentId: paymentId ?? undefined,
        subscriptionId: dodoSubscriptionId ?? undefined,
        startDate,
        endDate,
        purchaseDate: startDate,
        createdAt: subscriptionCreatedAt ?? new Date(),
      });
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

      const existingSubscription = dodoSubscriptionId
        ? await prisma.subscription.findFirst({
            where: { dodoSubscriptionId },
            select: {
              status: true,
              startDate: true,
              endDate: true,
            },
          })
        : null;

      const nextStatus = data.cancel_at_next_billing_date
        ? "WiLL_EXPIRE"
        : parsedStatus;
      const nextStartDate = data?.start_date ? new Date(data.start_date) : null;
      const nextEndDate = data?.end_date ? new Date(data.end_date) : null;

      const hasSubscriptionChange = Boolean(
        existingSubscription &&
          (
            (nextStatus && existingSubscription.status !== nextStatus) ||
            !datesEqual(existingSubscription.startDate, nextStartDate) ||
            !datesEqual(existingSubscription.endDate, nextEndDate)
          ),
      );

      if (dodoSubscriptionId && data.cancel_at_next_billing_date) {
        if (!hasSubscriptionChange) {
          console.log(
            "Skipping subscription cancelled email because no DB change was detected:",
            dodoSubscriptionId,
          );
          return;
        }

        const updated = await prisma.subscription.updateMany({
          where: { dodoSubscriptionId },
          data: { status: "WiLL_EXPIRE" },
        });

        // Send cancellation email only when state actually transitions.
        if (updated.count > 0) {
          await sendBillingNotification({
            to: customerEmail,
            locale: data?.metadata?.locale,
            kind: "subscription_cancelled",
            userName: user.name,
            price: resolveMetadataAmount(data?.total_amount),
            subscriptionId: dodoSubscriptionId,
            purchaseDate: new Date(),
            createdAt: new Date(),
          });
        }
      } else if (dodoSubscriptionId) {
        if (!hasSubscriptionChange) {
          return;
        }

        const updated = await prisma.subscription.updateMany({
          where: { dodoSubscriptionId },
          data: updates,
        });

        if (updated.count === 0) {
          console.log(
            "Skipping subscription update because no DB row was changed:",
            dodoSubscriptionId,
          );
        }
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
      const refund_id = data?.refund_id;

      const isPartialRefund = Boolean(data?.is_partial);

      if (isPartialRefund) {
        console.log("Partial refund → no subscription change");
        return;
      }

      if (paymentId && refund_id) {
        const existingSubscription = await prisma.subscription.findFirst({
          where: { paymentId },
          select: { id: true },
        });

        if (!existingSubscription) {
          console.error("Payment not found in any subscription:", paymentId);
          return;
        }

        const updated = await prisma.subscription.updateMany({
          where: { paymentId, refunded: false },
          data: { status: "CANCELLED", refunded: true },
        });

        // Only send once when the first webhook updates refunded=false -> true.
        if (updated.count > 0) {
          await sendBillingNotification({
            to: customerEmail,
            locale: data?.metadata?.locale,
            kind: "refund_succeeded",
            userName: user.name,
            paymentId,
            price: resolveMetadataAmount(data?.amount),
            subscriptionId: data?.metadata?.subscriptionId ?? undefined,
            purchaseDate: new Date(),
            createdAt: new Date(),
          });
        } else {
          console.log("Duplicate refund.succeeded webhook ignored:", paymentId);
        }
      }

      console.log("Refund processed successfully for:", customerEmail);
    } catch (error) {
      console.error("Error handling refund webhook:", error);
    }
  },
});
