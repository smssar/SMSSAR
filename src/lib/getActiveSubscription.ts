import { prisma } from "./prisma";
import { auth } from "@/auth";
import { ensureFreePlan } from "@/lib/ensure-free-plan";

export async function getActiveSubscription(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, planId: true },
  });

  if (!user) {
    return null;
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "WiLL_EXPIRE"] },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!subscription) {
    const now = new Date();

    await ensureFreePlan();

    const freeSubscription = await prisma.subscription.create({
      data: {
        userId,
        planId: "plan_free",
        status: "ACTIVE",
        startDate: now,
        endDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 365),
        paymentId: null,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { planId: "plan_free" },
    });

    return freeSubscription;
  } else if (subscription.planId !== user.planId) {
    await prisma.user.update({
      where: { id: userId },
      data: { planId: subscription.planId },
    });
  }

  if (subscription.status === "SCHEDULED") {
    if (subscription.startDate && new Date() >= subscription.startDate) {
      const activatedSubscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: "ACTIVE" },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { planId: activatedSubscription.planId },
      });

      return activatedSubscription;
    }

    return null;
  }

  const isExpired =
    (subscription.status !== "ACTIVE" &&
      subscription.status !== "WiLL_EXPIRE") ||
    !subscription.endDate ||
    new Date() > subscription.endDate;

  if (isExpired) {
    await prisma.$transaction([
      prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: "EXPIRED" },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { planId: "plan_pro" },
      }),
    ]);
    return null;
  }

  return subscription;
}

export async function getScheduledSubscription(userId: string) {
  const scheduledSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "SCHEDULED",
    },
    include: {
      plan: true,
    },
    orderBy: {
      startDate: "asc",
    },
  });

  if (
    scheduledSubscription &&
    scheduledSubscription.startDate &&
    new Date() >= scheduledSubscription.startDate
  ) {
    // Disable any other active subscriptions for this user
    await prisma.subscription.updateMany({
      where: {
        userId,
        status: { in: ["ACTIVE", "WiLL_EXPIRE"] },
        NOT: { id: scheduledSubscription.id },
      },
      data: { status: "DISABLED" },
    });

    const activatedSubscription = await prisma.subscription.update({
      where: { id: scheduledSubscription.id },
      data: { status: "ACTIVE" },
      include: {
        plan: true,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { planId: activatedSubscription.planId },
    });

    return activatedSubscription;
  }

  return scheduledSubscription;
}

export function withSubscription(
  handler: (
    req: Request,
    context: unknown,
    subscription: Exclude<
      Awaited<ReturnType<typeof getActiveSubscription>>,
      null
    >,
  ) => Promise<Response>,
) {
  return async (req: Request, context: unknown) => {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await getActiveSubscription(session.user.id);

    if (!subscription) {
      return Response.json(
        {
          error: "Subscription expired. Your account is now on the free plan.",
        },
        { status: 403 },
      );
    }

    return handler(req, context, subscription);
  };
}
