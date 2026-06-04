import { prisma } from "./prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { PurchaseType } from "./types";

type PurchaseWithProduct = {
  quantity: number;
  purchaseProduct: { code: PurchaseType | null } | null;
};

export async function adjustPurchaseQuantity(
  tx: Prisma.TransactionClient,
  userId: string,
  code: PurchaseType,
  delta: number,
) {
  if (delta === 0) return;

  const purchases = await tx.purchase.findMany({
    where: {
      userId,
      status: "ACTIVE",
      purchaseProduct: { code },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, quantity: true },
  });

  if (delta < 0) {
    let remaining = -delta;

    for (const purchase of purchases) {
      if (remaining <= 0) break;

      const consume = Math.min(purchase.quantity, remaining);
      if (consume > 0) {
        await tx.purchase.update({
          where: { id: purchase.id },
          data: { quantity: purchase.quantity - consume },
        });
        remaining -= consume;
      }
    }

    if (remaining > 0) {
      throw new Error(
        `Not enough ${code} balance to consume ${-delta} unit${
          -delta === 1 ? "" : "s"
        }.`,
      );
    }

    return;
  }

  if (purchases.length === 0) {
    throw new Error(`No active ${code} purchase found to restore quantity.`);
  }

  await tx.purchase.update({
    where: { id: purchases[0].id },
    data: { quantity: purchases[0].quantity + delta },
  });
}

export async function getActivePurchasesWithProduct(
  userId: string,
): Promise<Array<PurchaseWithProduct>> {
  return prisma.purchase.findMany({
    where: { userId, status: "ACTIVE" },
    include: { purchaseProduct: true },
  });
}

export function sumPurchaseQuantityByCode(
  purchases: Array<PurchaseWithProduct>,
  code: PurchaseType,
) {
  return purchases.reduce(
    (sum, purchase) =>
      sum + (purchase.purchaseProduct?.code === code ? purchase.quantity : 0),
    0,
  );
}

export function buildPlanAllowance(
  baseLimit: number | null | undefined,
  purchasedExtra: number,
) {
  return baseLimit === null || baseLimit === undefined
    ? Infinity
    : baseLimit + purchasedExtra;
}

export async function adjustFeaturedPropertiesCount(
  tx: Prisma.TransactionClient,
  userId: string,
  delta: number,
) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { featuredproperties: true },
  });

  const next = Math.max((user?.featuredproperties ?? 0) + delta, 0);

  return tx.user.update({
    where: { id: userId },
    data: { featuredproperties: next },
  });
}
