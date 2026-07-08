import { fetchWithRetries } from "./fetchWithRetries";

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
