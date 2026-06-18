export const runtime = "nodejs";

import { llmAnalyze } from "@/lib/llmBot";
import { getWhatsappUser, addWhatsappMessage } from "@/lib/whatsapp-utils";
import { speechToText } from "@/lib/speech_to_text";
import { NextResponse } from "next/server";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "";

// Shared fetch helper with retries and timeout
async function fetchWithRetries(
  url: string,
  opts: RequestInit = {},
  retries = 2,
  timeoutMs = 10000,
): Promise<Response> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(id);
      return res;
    } catch (err) {
      lastErr = err;
      clearTimeout(id);
      if (attempt < retries)
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastErr;
}

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
  console.log("🔥 META POST RECEIVED");
  try {
    const body = await req.json();

    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    const message = value?.messages?.[0];

    if (message) {
      const messageId = message.id;
      const from = message.from;
      let text = message?.text?.body;

      // If no text, try to transcribe incoming audio/voice/document message
      if (!text) {
        const mediaId =
          message?.audio?.id ||
          message?.voice?.id ||
          message?.document?.id ||
          message?.image?.id;

        if (mediaId) {
          // helper: fetch with retries to mitigate transient timeouts
          const fetchWithRetries = async (
            url: string,
            opts: RequestInit = {},
            retries = 2,
            delayMs = 500,
          ): Promise<Response> => {
            let lastErr: unknown = null;
            for (let i = 0; i <= retries; i++) {
              try {
                return await fetch(url, opts);
              } catch (err) {
                lastErr = err;
                // small backoff
                await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
              }
            }
            throw lastErr;
          };

          try {
            const mediaMetaRes = await fetchWithRetries(
              `https://graph.facebook.com/v20.0/${mediaId}`,
              {
                headers: {
                  Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                },
              },
            );

            if (!mediaMetaRes.ok) {
              const errBody = await mediaMetaRes.text().catch(() => "");
              throw new Error(
                `media meta fetch failed: ${mediaMetaRes.status} ${errBody}`,
              );
            }

            const mediaMeta = await mediaMetaRes.json();
            const mediaUrl = mediaMeta?.url;

            if (mediaUrl) {
              const mediaRes = await fetchWithRetries(mediaUrl, {
                headers: {
                  Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                },
              });

              if (!mediaRes.ok) {
                const errBody = await mediaRes.text().catch(() => "");
                throw new Error(
                  `media download failed: ${mediaRes.status} ${errBody}`,
                );
              }

              const arrayBuffer = await mediaRes.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);

              // Check size before attempting transcription to avoid large multipart uploads
              const maxBytes = Number(
                process.env.GROQ_MAX_UPLOAD_BYTES || 5_000_000,
              );
              if (buffer.length > maxBytes) {
                console.warn(
                  `Incoming media too large for transcription: ${buffer.length} bytes (max ${maxBytes})`,
                );
                try {
                  await sendWhatsAppMessage(
                    from,
                    "Sorry — your audio file is too large to transcribe. Please send a shorter voice note or try again with a smaller file.",
                  );
                } catch (err) {
                  console.error(
                    "Failed to send large-file notice to WhatsApp user:",
                    err,
                  );
                }

                processedMessages.add(messageId);
                return NextResponse.json({ ok: true });
              }

              try {
                const transcript = await speechToText(buffer);
                if (transcript) text = transcript;
              } catch (err) {
                console.error("Failed to transcribe WhatsApp audio:", err);
              }
            }
          } catch (err) {
            console.error("Failed to fetch WhatsApp media:", err);
          }
        }
      }
      if (processedMessages.has(messageId)) {
        return NextResponse.json({ ok: true });
      }
      let whatsappUser = undefined;
      try {
        whatsappUser = await getWhatsappUser(from);
      } catch (err) {
        // Prisma may time out; log and continue with no DB-backed user.
        // We still proceed so the webhook remains responsive.
        console.error(
          "whatsapp webhook: getWhatsappUser failed, continuing without DB user",
          err,
        );
        whatsappUser = undefined;
      }

      // persist inbound message
      if (text && whatsappUser?.id) {
        try {
          await addWhatsappMessage(whatsappUser.id, "user", text);
        } catch (err) {
          console.error("Failed to save inbound whatsapp message:", err);
        }
      }

      // If we still have no text (couldn't fetch/transcribe), don't call llmAnalyze
      if (!text || text.trim() === "") {
        console.warn(
          "No text obtained from incoming message; skipping LLM analysis",
        );
        // Optionally notify the user that transcription failed
        try {
          await sendWhatsAppMessage(
            from,
            "Sorry, I couldn't process your audio message.",
          );
        } catch (err) {
          console.error("Failed to send failure notice to WhatsApp user:", err);
        }

        processedMessages.add(messageId);
        return NextResponse.json({ ok: true });
      }

      let data: string | undefined = undefined;
      try {
        const aiResponse = await llmAnalyze(text, whatsappUser?.id);
        data = await aiResponse.response;
        await sendWhatsAppMessage(from, data || "No response");
      } catch (err) {
        // LLM or upstream API may fail (network/timeouts). Notify user gracefully.
        console.error("whatsapp webhook: llmAnalyze/send failed", err);
        try {
          await sendWhatsAppMessage(
            from,
            "Sorry, I'm having trouble reaching the AI service right now. Please try again later.",
          );
        } catch (sendErr) {
          console.error(
            "Failed to send fallback message to WhatsApp user:",
            sendErr,
          );
        }

        processedMessages.add(messageId);
        return NextResponse.json({ ok: true });
      }

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
  const res = await fetchWithRetries(
    url,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    },
    2,
    8000,
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(`Failed to send WhatsApp message: ${res.status}`);
  }

  return data;
}
