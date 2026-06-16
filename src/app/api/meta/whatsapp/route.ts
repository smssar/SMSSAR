import { llmAnalyze } from "@/lib/llmBot";
import { getWhatsappUser, addWhatsappMessage } from "@/lib/whatsapp-utils";
import { NextResponse } from "next/server";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "";

// In-memory dedupe (use Redis in production)
const processedMessages = new Set<string>();

export async function GET(req: Request) {
  const url = new URL(req.url);

  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge || "", { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  try {
    console.log("🔥 META POST RECEIVED");
    const body = await req.json();

    // console.log("📩 Full webhook payload:", JSON.stringify(body, null, 2));

    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    const message = value?.messages?.[0];

    if (message) {
      const messageId = message.id;
      const from = message.from;
      const text = message?.text?.body;
      if (processedMessages.has(messageId)) {
        return NextResponse.json({ ok: true });
      }
      const whatsappUser = await getWhatsappUser(from);

      // persist inbound message
      if (text && whatsappUser?.id) {
        try {
          await addWhatsappMessage(whatsappUser.id, "user", text);
        } catch (err) {
          console.error("Failed to save inbound whatsapp message:", err);
        }
      }

      const aiResponse = await llmAnalyze(text || "", whatsappUser?.id);

      const data = await aiResponse.response;

      await sendWhatsAppMessage(from, data || "No response");

      try {
        if (whatsappUser?.id) {
          await addWhatsappMessage(whatsappUser.id, "assistant", data || "");
        }
      } catch (err) {
        console.error("Failed to save outbound whatsapp message:", err);
      }

      processedMessages.add(messageId);

      // console.log("✅ New WhatsApp message:");
      // console.log("From:", from);
      // console.log("Message ID:", messageId);
      // console.log("Text:", text);

      return NextResponse.json({ ok: true });
    }

    const status = value?.statuses?.[0];

    if (status) {
      // console.log("📊 Status update:", status);
      return NextResponse.json({ ok: true });
    }

    // --------------------
    // Ignore other events safely
    // --------------------
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function sendWhatsAppMessage(to: string, text: string) {
  const url = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body: text,
      },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    // console.error("WhatsApp send error:", data);
    throw new Error("Failed to send WhatsApp message");
  }

  // console.log("Message sent:", data);
  return data;
}
