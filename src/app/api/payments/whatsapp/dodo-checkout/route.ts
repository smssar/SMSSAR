import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestBaseUrl } from "@/lib/api-utils";
import { normalizePhoneNumber } from "@/lib/phone";
import type { Locale } from "@/lib/locales";

type WhatsappTokenCheckoutRequest = {
  phone: string;
  email: string;
  locale?: Locale;
  tokens?: number;
  amount?: number;
};

/**
 * POST /api/payments/whatsapp/dodo-checkout
 * Creates a Dodo checkout session for WhatsApp token packages
 */
export async function POST(req: NextRequest) {
  try {
    const body: WhatsappTokenCheckoutRequest = await req.json();
    const {
      phone,
      email,
      locale = "en",
      tokens: customTokens,
      amount: customAmount,
    } = body;

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

    // Get WhatsApp user and token package info
    console.log("Fetching WhatsApp user for phone:", phone);
    const whatsappUser = await prisma.whatsappUser.findUnique({
      where: { phoneNumber: normalizedPhone },
      select: {
        id: true,
        tokenPackagePrice: true,
        tokenPackageSize: true,
      },
    });
    if (!whatsappUser) {
      return NextResponse.json(
        { error: "WhatsApp user not found" },
        { status: 404 },
      );
    }

    if (customAmount && customAmount < 1000) {
      return NextResponse.json(
        { error: "Amount must be at least 1000 cents" },
        { status: 400 },
      );
    }

    const baseUrl = getRequestBaseUrl(req.headers) ?? "http://localhost:3000";
    const safeLocale: Locale =
      locale === "ar" || locale === "fr" ? locale : "en";

    // Use custom tokens/amount if provided, otherwise use package defaults
    const finalTokens = customTokens || whatsappUser.tokenPackageSize;
    const finalAmount = customAmount || whatsappUser.tokenPackagePrice;

    // Generate unique order ID
    const orderId = `WHATSAPP_TOKEN_${whatsappUser.id}_${Date.now()}`;

    // Get Dodo credentials and product ID
    const dodoApiKey = process.env.DODO_API_KEY;
    const dodoProductId = process.env.DODO_PRODUCT_ID_WHATSAPPBOOT;

    if (!dodoApiKey || !dodoProductId) {
      console.error(
        "Missing Dodo API credentials or DODO_WHATSAPP_TOKEN_PRODUCT_ID",
      );
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500 },
      );
    }
    console.log("Creating Dodo checkout session for WhatsApp tokens:");

    // Call Dodo API to create checkout session
    const dodoResponse = await fetch(
      `${process.env.DODO_MODE === "live" ? "https://live.dodopayments.com" : "https://test.dodopayments.com"}/checkouts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${dodoApiKey}`,
        },
        body: JSON.stringify({
          product_cart: [
            {
              product_id: dodoProductId,
              quantity: 1,
              amount: finalAmount,
            },
          ],
          customer: {
            email,
            phone_number: normalizedPhone,
          },
          return_url: `${baseUrl}/${safeLocale}/whatsapp-token-payment/success?orderId=${encodeURIComponent(orderId)}`,
          cancel_url: `${baseUrl}/${safeLocale}/whatsapp-token-payment?error=cancelled&phone=${encodeURIComponent(normalizedPhone)}`,
          metadata: {
            type: "whatsapp_tokens",
            phone: normalizedPhone,
            userId: whatsappUser.id,
            order_id: orderId,
            tokens: String(finalTokens),
          },
        }),
      },
    );

    if (!dodoResponse.ok) {
      const errorData = await dodoResponse.json().catch(() => ({}));
      console.error("Dodo checkout error:", dodoResponse.status, errorData);
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 },
      );
    }

    const dodoData = await dodoResponse.json();

    // Store payment intent in database for later verification
    try {
      await prisma.whatsappTokenPayment.upsert({
        where: { orderId },
        create: {
          orderId,
          whatsappUserId: whatsappUser.id,
          amount: finalAmount,
          tokens: finalTokens,
          dodoSessionId: dodoData.id,
          status: "PENDING",
          email,
        },
        update: {
          dodoSessionId: dodoData.id,
          status: "PENDING",
        },
      });
    } catch (dbError) {
      console.error("Failed to store payment intent:", dbError);
      // Continue anyway - we'll handle this in the webhook
    }

    return NextResponse.json({
      checkoutUrl: dodoData.checkout_url,
      sessionId: dodoData.id,
      orderId,
    });
  } catch (error) {
    console.error("WhatsApp token checkout error:", error);
    return NextResponse.json(
      { error: "Failed to process checkout" },
      { status: 500 },
    );
  }
}
