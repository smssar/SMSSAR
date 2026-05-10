import { NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, readJson } from "@/lib/api-utils";

export const runtime = "nodejs";

type UpdateMeBody = {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  bio?: string;
  currentPassword?: string;
  newPassword?: string;
};

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return jsonError("Authentication required.", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      phone: true,
      city: true,
      bio: true,
      createdAt: true,
      passwordHash: true,
    },
  });

  if (!user) {
    return jsonError("User not found.", 404);
  }

  return NextResponse.json({
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone,
      city: user.city,
      bio: user.bio,
      createdAt: user.createdAt,
      hasPassword: Boolean(user.passwordHash),
    },
  });
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return jsonError("Authentication required.", 401);
  }

  const body = await readJson<UpdateMeBody>(request);
  if (!body) {
    return jsonError("Invalid JSON body.");
  }

  const data: {
    name?: string;
    email?: string;
    phone?: string | null;
    city?: string | null;
    bio?: string | null;
    passwordHash?: string;
  } = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return jsonError("Name cannot be empty.", 400);
    }
    if (name.length < 2) {
      return jsonError("Name must be at least 2 characters long.", 400);
    }
    data.name = name;
  }

  if (typeof body.email === "string") {
    const email = body.email.trim().toLowerCase();
    if (!email) {
      return jsonError("Email cannot be empty.", 400);
    }
    if (!email.includes("@")) {
      return jsonError("Please enter a valid email address.", 400);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== session.user.id) {
      return jsonError(
        "This email address is already in use. Please use a different email.",
        409,
      );
    }

    data.email = email;
  }

  if (typeof body.phone === "string") {
    const phone = body.phone.trim();
    data.phone = phone.length > 0 ? phone : null;
  }

  if (typeof body.city === "string") {
    const city = body.city.trim();
    data.city = city.length > 0 ? city : null;
  }

  if (typeof body.bio === "string") {
    const bio = body.bio.trim();
    data.bio = bio.length > 0 ? bio : null;
  }

  if (typeof body.newPassword === "string") {
    const password = body.newPassword.trim();
    if (password.length > 0) {
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { passwordHash: true },
      });

      if (currentUser?.passwordHash) {
        if (!body.currentPassword) {
          return jsonError(
            "Current password is required to change your password. Please enter your current password first.",
            400,
          );
        }

        if (body.currentPassword.trim().length === 0) {
          return jsonError(
            "Current password cannot be empty. Please enter your current password.",
            400,
          );
        }

        const isPasswordValid = await compare(
          body.currentPassword,
          currentUser.passwordHash,
        );
        if (!isPasswordValid) {
          return jsonError(
            "The current password you entered is incorrect. Please try again.",
            401,
          );
        }
      }

      if (password.length < 8) {
        return jsonError(
          "New password must be at least 8 characters long. Please enter a stronger password.",
          400,
        );
      }

      if (currentUser?.passwordHash && password === body.currentPassword) {
        return jsonError(
          "New password must be different from your current password.",
          400,
        );
      }

      data.passwordHash = await hash(password, 12);
    }
  }

  if (
    !data.name &&
    !data.email &&
    !data.phone &&
    !data.city &&
    !data.bio &&
    !data.passwordHash
  ) {
    return jsonError("No valid fields were provided.", 400);
  }

  try {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        city: true,
        bio: true,
        createdAt: true,
        passwordHash: true,
      },
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        status: updated.status,
        phone: updated.phone,
        city: updated.city,
        bio: updated.bio,
        createdAt: updated.createdAt,
        hasPassword: Boolean(updated.passwordHash),
      },
    });
  } catch (error: unknown) {
    console.error("Failed to update profile:", error);

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return jsonError(
          "An email or value you entered is already in use. Please try again.",
          409,
        );
      }
      if (error.message.includes("not found")) {
        return jsonError("User not found. Please try logging in again.", 404);
      }
    }

    return jsonError("Failed to update profile. Please try again later.", 500);
  }
}
