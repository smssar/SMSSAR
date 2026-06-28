export const runtime = "nodejs";

import { llmAnalyze } from "@/lib/llmBot";
import { getWhatsappUser, addWhatsappMessage } from "@/lib/whatsapp-utils";
import { prisma } from "@/lib/prisma";
import { resolveWhatsappTokenLimitReached } from "@/lib/whatsapp-utils";
import { detectLang } from "@/lib/utils";
import { normalizePhoneNumber } from "@/lib/phone";
import { speechToText } from "@/lib/speech_to_text";
import { NextResponse } from "next/server";
import { WhatsappUserWithTokenLock } from "@/lib/types";

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

// Dedupe persisted in DB via WhatsappMessage.externalId

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
    const body = await req.json();

    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    const message = value?.messages?.[0];
    const contactName = value?.contacts?.[0]?.profile?.name ?? undefined;

    if (!message) {
      return NextResponse.json({ ok: true });
    }

    if (message) {
      const messageId = message.id;
      const from = message.from;
      let normalizedFrom = from;
      try {
        normalizedFrom = normalizePhoneNumber(from);
      } catch {
        normalizedFrom = from;
      }
      let text = message?.text?.body;

      try {
        const statusUrl = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
        await fetchWithRetries(
          statusUrl,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              status: "read",
              message_id: messageId,
              typing_indicator: { type: "text" },
            }),
          },
          1,
          3000,
        );
      } catch (err) {
        console.error("Failed to send WhatsApp typing/read indicator:", err);
      }

      let whatsappUser: WhatsappUserWithTokenLock | undefined = undefined;
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
      try {
        const existing = await prisma.$queryRaw`
          SELECT id FROM "WhatsappMessage" WHERE "externalId" = ${messageId} LIMIT 1
        `;
        if (
          existing &&
          (Array.isArray(existing) ? existing.length > 0 : true)
        ) {
          return NextResponse.json({ ok: true });
        }
      } catch (err) {
        // If DB check fails, continue — we'll still attempt to save and avoid crashing the webhook
        console.error("whatsapp webhook: dedupe DB check failed", err);
      }
      try {
        // If no text, try to transcribe incoming audio/voice/document message
        if (!text) {
          const mediaId = message?.audio?.id || message?.voice?.id;
          // ||
          // message?.document?.id ||
          // message?.image?.id;

          if (mediaId) {
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
                const maxBytes = Number(50);
                if (buffer.length > maxBytes) {
                  console.warn(
                    `Incoming media too large for transcription: ${buffer.length} bytes (max ${maxBytes})`,
                  );
                  try {
                    const largeFileMessage =
                      whatsappUser?.language === "ar"
                        ? "عذرًا - ملف الصوت الخاص بك كبير جدًا ليتم نسخه. يرجى إرسال ملاحظة صوتية أقصر أو المحاولة مرة أخرى باستخدام ملف أصغر."
                        : whatsappUser?.language === "fr"
                          ? "Désolé — votre fichier audio est trop volumineux pour être transcrit. Veuillez envoyer une note vocale plus courte ou réessayer avec un fichier plus petit."
                          : "Sorry — your audio file is too large to transcribe. Please send a shorter voice note or try again with a smaller file.";

                    await sendWhatsAppMessage(from, largeFileMessage);
                  } catch (err) {
                    console.error(
                      "Failed to send large-file notice to WhatsApp user:",
                      err,
                    );
                  }

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

        // Persist contact name to WhatsappUser.name when available
        if (contactName && whatsappUser?.id) {
          try {
            // Only update if name is missing or different
            if (!whatsappUser.name || whatsappUser.name !== contactName) {
              await prisma.whatsappUser.update({
                where: { id: whatsappUser.id },
                data: { name: contactName },
              });
            }
          } catch (err) {
            console.error("Failed to persist Whatsapp contact name:", err);
          }
        }

        if (text && whatsappUser?.id) {
          try {
            await addWhatsappMessage(whatsappUser.id, "user", text, {
              externalId: messageId,
            });
          } catch (err) {
            console.error("Failed to save inbound whatsapp message:", err);
          }
        }

        if (!text || text.trim() === "") {
          console.warn(
            "No text obtained from incoming message; skipping LLM analysis",
          );
          // Optionally notify the user that transcription failed
          try {
            await sendWhatsAppMessage(
              from,
              whatsappUser?.language == "ar"
                ? "عذرًا، لم أتمكن من فهم رسالتك. يرجى إرسال نص أو ملاحظة صوتية واضحة."
                : whatsappUser?.language === "fr"
                  ? "Désolé, je n'ai pas compris votre message. Veuillez envoyer un texte ou une note vocale claire."
                  : "Sorry, I couldn't understand your message. Please send clear text or a voice note.",
            );
          } catch (err) {
            console.error(
              "Failed to send failure notice to WhatsApp user:",
              err,
            );
          }

          return NextResponse.json({ ok: true });
        }

        const currentTokenUsage = whatsappUser?.monthlyUsageTokens ?? 0;
        const tokensLimit = whatsappUser?.tokensLimit ?? null;
        const limitAlreadyReached = resolveWhatsappTokenLimitReached(
          currentTokenUsage,
          tokensLimit,
        );

        if (
          whatsappUser?.id &&
          whatsappUser.tokenLimitReached !== limitAlreadyReached
        ) {
          try {
            await prisma.whatsappUser.update({
              where: { id: whatsappUser.id },
              data: { tokenLimitReached: limitAlreadyReached },
            });
            whatsappUser.tokenLimitReached = limitAlreadyReached;
          } catch (err) {
            console.error("Failed to normalize tokenLimitReached state:", err);
          }
        }

        // Build payment link for token packages
        const locale =
          whatsappUser?.language === "ar"
            ? "ar"
            : whatsappUser?.language === "fr"
              ? "fr"
              : "en";
        const paymentPageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${locale}/whatsapp-token-payment?phone=${encodeURIComponent(normalizedFrom)}`;

        const limitReachedMessage =
          whatsappUser?.language === "ar"
            ? `لقد وصلت إلى الحد الشهري لاستخدام الرسائل لهذا الحساب. 😊
             للاستمرار في التحدث مع المساعد، يرجى شراء باقة رسائل جديدة.
            ${paymentPageUrl}`
            : whatsappUser?.language === "fr"
              ? `Vous avez atteint la limite mensuelle de messages pour ce compte. 😊
                Pour continuer à discuter avec l'assistant, veuillez acheter un nouveau forfait de messages.
                ${paymentPageUrl}`
              : `You've reached your monthly message limit for this account. 😊
              To continue chatting with the assistant, please purchase a new message package.
              ${paymentPageUrl}`;
        if (whatsappUser?.id && limitAlreadyReached) {
          try {
            await prisma.whatsappUser.update({
              where: { id: whatsappUser.id },
              data: { tokenLimitReached: true },
            });
            whatsappUser.tokenLimitReached = true;
          } catch (err) {
            console.error("Failed to persist tokenLimitReached state:", err);
          }

          try {
            await sendWhatsAppMessage(from, limitReachedMessage);
            try {
              const detected = await detectLang(text);
              console.log("detected:", detected);
              if (
                detected &&
                whatsappUser?.id &&
                whatsappUser.language !== detected
              ) {
                await prisma.whatsappUser.update({
                  where: { id: whatsappUser.id },
                  data: { language: detected },
                });
                whatsappUser.language = detected;
              }
            } catch (err) {
              console.error(
                "Failed to persist detected WhatsappUser.language:",
                err,
              );
            }
          } catch (err) {
            console.error("Failed to send token-limit warning:", err);
          }

          return NextResponse.json({ ok: true });
        }

        let data: string | undefined = undefined;
        try {
          // Notify WhatsApp that we've received the message and show typing indicator

          const aiResponse = await llmAnalyze(text, whatsappUser);
          data = aiResponse.response ?? "";
          const parsedAi = aiResponse as {
            role?: string;
            response?: string | null;
            tokenUsage?: {
              promptTokens: number;
              completionTokens: number;
              totalTokens: number;
            } | null;
            properties?: Array<{
              id: string;
              imageUrl?: string | null;
              media?: Array<{ url: string }> | null;
            }>;
          };

          const usageTokens = parsedAi.tokenUsage?.totalTokens ?? 0;
          const nextTokenUsage = currentTokenUsage + usageTokens;

          const persistTokenUsageAndWarn = async () => {
            if (!whatsappUser?.id || usageTokens <= 0) return;

            const nextTokenLimitReached = resolveWhatsappTokenLimitReached(
              nextTokenUsage,
              tokensLimit,
            );

            try {
              await prisma.whatsappUser.update({
                where: { id: whatsappUser.id },
                data: {
                  tokenUsage: nextTokenUsage,
                  tokenLimitReached: nextTokenLimitReached,
                },
              });
              whatsappUser.tokenUsage = nextTokenUsage;
              whatsappUser.tokenLimitReached = nextTokenLimitReached;
            } catch (err) {
              console.error("Failed to persist WhatsappUser.tokenUsage:", err);
            }

            if (nextTokenLimitReached) {
              try {
                await sendWhatsAppMessage(from, limitReachedMessage);
              } catch (err) {
                console.error("Failed to send token-limit warning:", err);
              }
            }
          };

          if (
            parsedAi &&
            parsedAi.role === "property_search" &&
            Array.isArray(parsedAi.properties) &&
            parsedAi.properties.length > 0
          ) {
            try {
              const prop = parsedAi.properties[0];
              const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
              const locale = whatsappUser?.language || "ar";
              const link = `${baseUrl}/${locale}/properties/${prop.id}`;
              const imageUrl =
                prop.imageUrl ?? prop.media?.[0]?.url ?? undefined;

              let dbProp = null;
              try {
                dbProp = await prisma.property.findUnique({
                  where: { id: prop.id },
                  select: { id: true },
                });
              } catch (err) {
                console.error("Failed to verify property existence:", err);
              }

              if (dbProp) {
                if (imageUrl) {
                  await sendWhatsAppMessage(from, data || "", {
                    imageUrl,
                    link,
                  });
                } else {
                  await sendWhatsAppMessage(from, `${data || ""}\n${link}`);
                }
              } else {
                // No matching property in DB — do not send images or links. Send only the textual response.
                await sendWhatsAppMessage(
                  from,
                  data || whatsappUser?.language === "ar"
                    ? "عذرًا، لم أتمكن من العثور على أي عقارات مطابقة لطلبك."
                    : whatsappUser?.language === "fr"
                      ? "Désolé, je n'ai trouvé aucune propriété correspondant à votre demande."
                      : "Sorry, I couldn't find any properties matching your request.",
                );
              }

              try {
                if (whatsappUser?.id) {
                  await addWhatsappMessage(
                    whatsappUser.id,
                    "assistant",
                    data || "",
                  );
                }
              } catch (err) {
                console.error("Failed to save outbound whatsapp message:", err);
              }

              await persistTokenUsageAndWarn();

              return NextResponse.json({ ok: true });
            } catch (err) {
              console.error("Failed to handle property_search response:", err);
            }
          }

          const fallbackMessage =
            data ||
            (whatsappUser?.language === "ar"
              ? "عذرًا، لم أتمكن من فهم رسالتك."
              : whatsappUser?.language === "fr"
                ? "Désolé, je n'ai pas compris votre message."
                : "Sorry, I couldn't understand your message.");

          try {
            await sendWhatsAppMessage(from, fallbackMessage);
          } catch (err) {
            console.error("Failed to send WhatsApp message:", err);
          }

          await persistTokenUsageAndWarn();
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

          return NextResponse.json({ ok: true });
        }

        try {
          if (whatsappUser?.id) {
            await addWhatsappMessage(whatsappUser.id, "assistant", data || "");
          }
        } catch (err) {
          console.error("Failed to save outbound whatsapp message:", err);
        }

        try {
          const detected = await detectLang(text);
          console.log("detected:", detected);
          if (
            detected &&
            whatsappUser?.id &&
            whatsappUser.language !== detected
          ) {
            await prisma.whatsappUser.update({
              where: { id: whatsappUser.id },
              data: { language: detected },
            });
            whatsappUser.language = detected;
          }
        } catch (err) {
          console.error(
            "Failed to persist detected WhatsappUser.language:",
            err,
          );
        }

        return NextResponse.json({ ok: true });
      } catch (err) {
        // On error, allow the message to be retried by removing dedupe mark
        // nothing special to cleanup — dedupe is persisted by saving `externalId` on the message
        throw err;
      }
    }

    const status = value?.statuses?.[0];

    if (status) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function sendWhatsAppMessage(
  to: string,
  text: string,
  opts?: { imageUrl?: string; link?: string },
) {
  const url = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  if (opts?.imageUrl) {
    // Send image message with caption that may include link
    const caption = text || "";
    const body = JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "image",
      image: {
        link: opts.imageUrl,
        caption: opts.link ? `${caption}\n${opts.link}` : caption,
      },
    });

    const res = await fetchWithRetries(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body,
      },
      2,
      8000,
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(`Failed to send WhatsApp image message: ${res.status}`);
    }

    return data;
  }

  // Default: send text message (optionally append link)
  const finalText = opts?.link ? `${text}\n${opts.link}` : text;

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
        text: { body: finalText },
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
