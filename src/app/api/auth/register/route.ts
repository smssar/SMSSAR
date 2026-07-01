import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, readJson } from "@/lib/api-utils";
import { ensureFreePlan } from "@/lib/ensure-free-plan";
import { normalizePhoneNumber } from "@/lib/phone";
import {
  generateVerificationCode,
  hashVerificationCode,
  sendVerificationCodeEmail,
} from "@/lib/email-verification";

export const runtime = "nodejs";

type RegisterBody = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  phone?: string;
  locale?: string;
};

export async function POST(request: Request) {
  const body = await readJson<RegisterBody>(request);

  if (!body) {
    return jsonError("Invalid JSON body.");
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const confirmPassword = body.confirmPassword;
  const roleValue = body.role?.trim().toLowerCase();
  const phone = body.phone?.trim();
  const locale = body.locale?.trim() || "en";

  if (!name || !email || !password || !confirmPassword || !roleValue) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "weak_password" }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "password_mismatch" }, { status: 400 });
  }

  const role =
    roleValue === "seller"
      ? "SELLER"
      : roleValue === "smssar"
        ? "SMSSAR"
        : "USER";
  const sellerPhone =
    role === "SELLER" || role === "SMSSAR" ? phone : undefined;

  if ((role === "SELLER" || role === "SMSSAR") && !sellerPhone) {
    return NextResponse.json(
      { error: "seller_phone_required" },
      { status: 400 },
    );
  }

  let normalizedPhone: string | null = null;
  if (sellerPhone) {
    try {
      normalizedPhone = normalizePhoneNumber(sellerPhone);
    } catch {
      return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
    }
  }

  const passwordHash = await hash(password, 12);

  try {
    await ensureFreePlan();
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json({ error: "email_exists" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        planId: "plan_free",
        role,
        phone: normalizedPhone,
      },
      select: {
        id: true,
        role: true,
        planId: true,
      },
    });

    const code = generateVerificationCode();

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashVerificationCode(code),
        expires: new Date(Date.now() + 1000 * 60 * 15),
      },
    });

    await sendVerificationCodeEmail(locale, email, code);

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "email_exists" }, { status: 409 });
    }

    try {
      if (email) {
        await prisma.verificationToken.deleteMany({
          where: { identifier: email },
        });
        await prisma.user.deleteMany({ where: { email } });
      }
    } catch {
      // ignore rollback errors
    }

    return jsonError("Failed to register account.", 500);
  }
}
