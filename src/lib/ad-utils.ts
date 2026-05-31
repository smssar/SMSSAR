import { prisma } from "@/lib/prisma";
import type { AdStatus } from "@/generated/prisma/enums";

/**
 * Update ad statuses based on their scheduled times
 * - SCHEDULED → RUNNING if startAt <= now and endAt >= now
 * - RUNNING → ENDED if endAt < now
 * - SCHEDULED → ENDED if endAt < now (end before start)
 */
export async function updateAdStatuses() {
  const now = new Date();

  // Update SCHEDULED ads that should now be RUNNING
  await prisma.ad.updateMany({
    where: {
      status: "SCHEDULED",
      startAt: {
        lte: now,
      },
      endAt: {
        gte: now,
      },
    },
    data: {
      status: "RUNNING",
    },
  });

  // Update RUNNING ads that have ended
  await prisma.ad.updateMany({
    where: {
      status: "RUNNING",
      endAt: {
        lt: now,
      },
    },
    data: {
      status: "ENDED",
    },
  });

  // Update SCHEDULED ads that ended before they started
  await prisma.ad.updateMany({
    where: {
      status: "SCHEDULED",
      endAt: {
        lt: now,
      },
    },
    data: {
      status: "ENDED",
    },
  });
}

/**
 * Get the correct status for an ad based on its scheduled times
 */
export function getAdStatus(
  currentStatus: AdStatus,
  startAt: Date | null,
  endAt: Date | null,
): AdStatus {
  if (!startAt || !endAt) return currentStatus;

  const now = new Date();

  if (now < startAt) return "SCHEDULED";
  if (now >= startAt && now <= endAt) return "RUNNING";
  if (now > endAt) return "ENDED";

  return currentStatus;
}
