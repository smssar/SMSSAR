import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, readJson } from "@/lib/api-utils";
import { normalizePhoneNumber } from "@/lib/phone";

export const runtime = "nodejs";

type CreateUserBody = {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  status?: string;
  phone?: string;
  bio?: string;
  planId?: string;
  emailVerified?: string | null;
  suspendedUntil?: string | null;
  suspendedMessage?: string | null;
  bannedMessage?: string | null;
};

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return jsonError("Authentication required.", 401);
  }

  if (session.user.role !== "ADMIN") {
    return jsonError("Only admins can view users.", 403);
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      phone: true,
      bio: true,
      role: true,
      status: true,
      suspendedAt: true,
      suspendedUntil: true,
      suspendedMessage: true,
      suspendedBy: true,
      bannedMessage: true,
      planId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: users });
}

export async function POST(request: Request) {
  try {
    const url = (request as Request & { url?: string }).url ?? "<no-url>";
    console.debug("/api/admin/users POST called", { url });
  } catch {}
  const session = await auth();

  if (!session?.user?.id) {
    return jsonError("Authentication required.", 401);
  }

  if (session.user.role !== "ADMIN") {
    return jsonError("Only admins can create users.", 403);
  }

  const body = await readJson<CreateUserBody>(request);
  if (!body) {
    return jsonError("Invalid JSON body.");
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password?.trim();
  const role = body.role?.toUpperCase() as
    | "USER"
    | "SELLER"
    | "SMSSAR"
    | "ADMIN"
    | undefined;
  const status = body.status?.toUpperCase() as
    | "ACTIVE"
    | "PENDING"
    | "SUSPENDED"
    | "BANNED"
    | undefined;

  if (!name || !email || !password) {
    return jsonError("Fields 'name', 'email', and 'password' are required.");
  }

  if (!["USER", "SELLER", "SMSSAR", "ADMIN"].includes(role ?? "")) {
    return jsonError("Role must be USER, SELLER, SMSSAR, or ADMIN.");
  }

  if (!["ACTIVE", "PENDING", "SUSPENDED", "BANNED"].includes(status ?? "")) {
    return jsonError("Status must be ACTIVE, PENDING, SUSPENDED, or BANNED.");
  }

  const requestedPlanId = body.planId?.trim().toLowerCase();
  const verifiedAt =
    typeof body.emailVerified === "string" && body.emailVerified.trim()
      ? new Date(body.emailVerified)
      : null;

  const suspendedUntil =
    typeof body.suspendedUntil === "string" && body.suspendedUntil.trim()
      ? new Date(body.suspendedUntil)
      : null;

  if (suspendedUntil && Number.isNaN(suspendedUntil.getTime())) {
    return jsonError("suspendedUntil must be a valid date-time.", 400);
  }

  if (status === "SUSPENDED" && !suspendedUntil) {
    return jsonError(
      "suspendedUntil is required when status is SUSPENDED.",
      400,
    );
  }

  if (verifiedAt && Number.isNaN(verifiedAt.getTime())) {
    return jsonError("emailVerified must be a valid date-time.", 400);
  }

  try {
    const defaultPlan = await prisma.plan.findFirst({
      orderBy: { price: "asc" },
    });
    const planId = requestedPlanId ?? defaultPlan?.id ?? null;

    if (!planId) {
      return jsonError("No plans available. Ask an admin to create one.", 400);
    }

    const planExists = await prisma.plan.findUnique({ where: { id: planId } });
    if (!planExists) {
      return jsonError("Selected plan does not exist.", 400);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return jsonError("Email already exists.", 409);
    }

    const passwordHash = await hash(password, 12);
    const phone = body.phone?.trim();
    const bio = body.bio?.trim();
    const isSuspended = status === "SUSPENDED";
    const isBanned = status === "BANNED";
    const suspendedMessage =
      typeof body.suspendedMessage === "string"
        ? body.suspendedMessage.trim() || null
        : null;
    const bannedMessage =
      typeof body.bannedMessage === "string"
        ? body.bannedMessage.trim() || null
        : null;

    let normalizedPhone: string | null = null;
    if (phone) {
      try {
        normalizedPhone = normalizePhoneNumber(phone);
      } catch {
        return jsonError("Invalid phone number.", 400);
      }
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
          phone: normalizedPhone,
        bio: bio ? bio : null,
        role: role as "USER" | "SELLER" | "SMSSAR" | "ADMIN",
        status: status as "ACTIVE" | "PENDING" | "SUSPENDED" | "BANNED",
        suspendedAt: isSuspended || isBanned ? new Date() : null,
        suspendedUntil: isBanned ? null : suspendedUntil,
        suspendedMessage: isSuspended ? suspendedMessage : null,
        suspendedBy: isSuspended || isBanned ? session.user.id : null,
        bannedMessage: isBanned ? bannedMessage : null,
        planId,
        emailVerified: verifiedAt,
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        phone: true,
        bio: true,
        role: true,
        status: true,
        suspendedAt: true,
        suspendedUntil: true,
        suspendedMessage: true,
        suspendedBy: true,
        bannedMessage: true,
        planId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create user:", error);
    return jsonError("Failed to create user.", 500);
  }
}
