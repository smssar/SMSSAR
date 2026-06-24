import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function detectLang(text: string): Promise<string> {
  // minimal fetch with retries and timeout tailored for Deepseek calls
  const fetchWithRetries = async (
    url: string,
    opts: RequestInit,
    retries = 2,
    timeoutMs = 10000,
  ): Promise<Response> => {
    let lastErr: unknown = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { ...opts, signal: controller.signal });
        clearTimeout(id);
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${body}`);
        }
        return res;
      } catch (err) {
        lastErr = err;
        clearTimeout(id);
        if (attempt < retries)
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
    throw lastErr;
  };

  try {
    const url = "https://api.deepseek.com/chat/completions";
    const systemPrompt = `You are a language detection assistant. Reply with a single, lower-case ISO 639-1 language code that best matches the user's text: 'ar' for Arabic, 'fr' for French, 'en' for English. Respond with only the code and no other text.`;

    const res = await fetchWithRetries(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-v4-flash",
          thinking: { type: "disabled" },
          temperature: 0,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text },
          ],
        }),
      },
      2,
      8000,
    );

    const data = await res.json().catch(() => ({}));
    const content = (data?.choices?.[0]?.message?.content || "")
      .trim()
      .toLowerCase();
    if (content === "ar" || content === "fr" || content === "en")
      return content;
  } catch (err) {
    // ignore and fallback to heuristic
    console.error("detectLang deepseek failed:", err);
  }

  // Fallback heuristic: Arabic script detection, basic French accents, otherwise English
  if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text)) return "ar";
  if (/[éèêàùôçÉÈÊÀÙÔÇ]/.test(text)) return "fr";
  return "en";
}
