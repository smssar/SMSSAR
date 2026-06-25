import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/locales";
import { normalizePhoneNumber } from "@/lib/phone";

type UpdateUserContactRequest = {
  phone: string;
  email: string;
  locale?: Locale;
};

/**
 * POST /api/whatsapp/update-user-contact
 * Updates WhatsApp user's email contact information
 */
export async function POST(req: NextRequest) {
  try {
    const body: UpdateUserContactRequest = await req.json();
    const { phone, email } = body;

    if (!phone?.trim()) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    let normalizedPhone: string;
    try {
      normalizedPhone = normalizePhoneNumber(phone);
    } catch {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Find or create WhatsApp user
    let whatsappUser = await prisma.whatsappUser.findUnique({
      where: { phoneNumber: normalizedPhone },
    });

    if (whatsappUser) {
      // Update existing user with email
      whatsappUser = await prisma.whatsappUser.update({
        where: { id: whatsappUser.id },
        data: { email },
      });
    } else {
      // Create new user with email
      whatsappUser = await prisma.whatsappUser.create({
        data: {
          phoneNumber: normalizedPhone,
          email,
          language: "ar", // Default to Arabic
        },
      });
    }

    return NextResponse.json({
      success: true,
      userId: whatsappUser.id,
      email: whatsappUser.email,
    });
  } catch (error) {
    console.error("Error updating WhatsApp user contact:", error);
    return NextResponse.json(
      { error: "Failed to update contact information" },
      { status: 500 },
    );
  }
}
