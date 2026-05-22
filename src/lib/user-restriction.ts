export type UserRestrictionStatus = "SUSPENDED" | "BANNED";

export type RestrictableUser = {
  status: "ACTIVE" | "PENDING" | "SUSPENDED" | "BANNED";
  suspendedUntil?: Date | string | null;
  suspendedMessage?: string | null;
  bannedMessage?: string | null;
};

export type UserRestriction = {
  type: UserRestrictionStatus;
  message: string | null;
  until: Date | null;
};

export function isExpiredSuspension(
  user: Pick<RestrictableUser, "status" | "suspendedUntil">,
  now = new Date(),
): boolean {
  if (user.status !== "SUSPENDED") {
    return false;
  }

  const until = toDate(user.suspendedUntil);
  return Boolean(until && until <= now);
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getUserRestriction(
  user: RestrictableUser,
  now = new Date(),
): UserRestriction | null {
  if (user.status === "BANNED") {
    return {
      type: "BANNED",
      message: user.bannedMessage?.trim() || null,
      until: null,
    };
  }

  if (user.status !== "SUSPENDED") {
    return null;
  }

  const until = toDate(user.suspendedUntil);
  if (until && until <= now) {
    return null;
  }

  return {
    type: "SUSPENDED",
    message: user.suspendedMessage?.trim() || null,
    until,
  };
}
