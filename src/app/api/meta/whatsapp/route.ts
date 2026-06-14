import { NextResponse } from "next/server";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!;

// simple in-memory dedupe (use Redis in production)
const processedMessages = new Set<string>();

export async function GET(req: Request) {
  const url = new URL(req.url);

  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();

//     const entry = body.entry?.[0];
//     const change = entry?.changes?.[0]?.value;

//     const message = change?.messages?.[0];
//     if (!message) {
//       return NextResponse.json({ ok: true });
//     }
//     console.log("Webhook received:", { body, message });

//     const messageId = message.id;
//     const from = message.from;
//     const text = message.text?.body;

//     if (!text) return NextResponse.json({ ok: true });

//     if (processedMessages.has(messageId)) {
//       return NextResponse.json({ ok: true });
//     }
//     processedMessages.add(messageId);

//     console.log("Received message:", { from, text, messageId });

//     return NextResponse.json({ ok: true });
//   } catch (err) {
//     console.error("Webhook error:", err);
//     return NextResponse.json({ ok: false }, { status: 500 });
//   }
// }
