import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, readJson } from "@/lib/api-utils";

export const runtime = "nodejs";

type UpdateUserBody = {
  name?: string;
  password?: string | null;
  role?: string;
  status?: string;
  phone?: string | null;
  bio?: string | null;
  planId?: string;
  emailVerified?: string | null;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  console.debug("/api/admin/users/[id] PATCH called", { params });
  const session = await auth();

  if (!session?.user?.id) {
    return jsonError("Authentication required.", 401);
  }

  if (session.user.role !== "ADMIN") {
    return jsonError("Only admins can update users.", 403);
  }

  const { id } = await params;
  if (!id)
    return jsonError("User id is required in URL for PATCH/DELETE.", 400);

  const body = await readJson<UpdateUserBody>(request);
  if (!body) return jsonError("Invalid JSON body.");

  const data: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) return jsonError("Name cannot be empty.", 400);
    data.name = name;
  }

  if (typeof body.role === "string") {
    const role = body.role.toUpperCase();
    if (!["USER", "SELLER", "ADMIN"].includes(role)) {
      return jsonError("Role must be USER, SELLER, or ADMIN.", 400);
    }
    data.role = role;
  }

  if (typeof body.status === "string") {
    const status = body.status.toUpperCase();
    if (!["ACTIVE", "PENDING", "FLAGGED"].includes(status)) {
      return jsonError("Status must be ACTIVE, PENDING, or FLAGGED.", 400);
    }
    data.status = status;
  }

  if (body.phone !== undefined) {
    if (typeof body.phone !== "string" && body.phone !== null) {
      return jsonError("Phone must be a string or null.", 400);
    }
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    data.phone = phone ? phone : null;
  }

  if (body.bio !== undefined) {
    if (typeof body.bio !== "string" && body.bio !== null) {
      return jsonError("Bio must be a string or null.", 400);
    }
    const bio = typeof body.bio === "string" ? body.bio.trim() : "";
    data.bio = bio ? bio : null;
  }

  if (body.planId !== undefined) {
    if (typeof body.planId !== "string") {
      return jsonError("Plan ID must be a string.", 400);
    }
    const planId = body.planId.toLowerCase();
    const planExists = await prisma.plan.findUnique({ where: { id: planId } });
    if (!planExists) {
      return jsonError("Selected plan does not exist.", 400);
    }
    data.planId = planId;
  }

  if (body.emailVerified !== undefined) {
    if (typeof body.emailVerified !== "string" && body.emailVerified !== null) {
      return jsonError("emailVerified must be a string or null.", 400);
    }

    const verifiedAt =
      typeof body.emailVerified === "string" && body.emailVerified.trim()
        ? new Date(body.emailVerified)
        : null;

    if (verifiedAt && Number.isNaN(verifiedAt.getTime())) {
      return jsonError("emailVerified must be a valid date-time.", 400);
    }

    data.emailVerified = verifiedAt;
  }

  if (body.password !== undefined && body.password !== null) {
    if (typeof body.password !== "string")
      return jsonError("Password must be a string.", 400);
    const pw = body.password.trim();
    if (pw.length > 0) {
      data.passwordHash = await hash(pw, 12);
    }
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return jsonError("User not found.", 404);

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        phone: true,
        bio: true,
        role: true,
        status: true,
        planId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error: unknown) {
    console.error("Failed to update user:", error);
    return jsonError("Failed to update user.", 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  console.debug("/api/admin/users/[id] DELETE called", { params });
  const session = await auth();

  if (!session?.user?.id) {
    return jsonError("Authentication required.", 401);
  }

  if (session.user.role !== "ADMIN") {
    return jsonError("Only admins can delete users.", 403);
  }

  const { id } = await params;
  if (!id)
    return jsonError("User id is required in URL for PATCH/DELETE.", 400);

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({});
  } catch (error: unknown) {
    console.error("Failed to delete user:", error);
    return jsonError("Failed to delete user.", 500);
  }
}
