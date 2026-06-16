import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

type Category = { name: string; slug: string };
type City = { name: string; slug: string };

export type PropertyFilters = {
  cities?: string[] | null;
  neighborhood?: string | null;
  categories?: string[] | null;
  priceMin?: number | null;
  priceMax?: number | null;
  rooms?: number | null;
  bathrooms?: number | null;
  forSale?: boolean | null;
  areaMin?: number;
  areaMax: number;
  sellerId?: string | null;
};

export const getCategories = unstable_cache(
  async (): Promise<Category[]> =>
    prisma.propertyType
      .findMany({
        orderBy: { name: "asc" },
        select: { name: true, slug: true },
      })
      .then((data) =>
        data
          .filter((c) => c.slug !== null)
          .map((c) => ({
            name: c.name,
            slug: c.slug!, // ✅ FIX
          })),
      ),
  ["property-categories"],
  { revalidate: 60 * 60 * 24 },
);

export const getCities = unstable_cache(
  async (): Promise<City[]> =>
    prisma.city
      .findMany({
        orderBy: { name: "asc" },
        select: { name: true, slug: true },
      })
      .then((data) =>
        data
          .filter((c) => c.slug !== null)
          .map((c) => ({
            name: c.name,
            slug: c.slug!, // ✅ FIX
          })),
      ),
  ["property-cities"],
  { revalidate: 60 * 60 * 24 },
);

async function deepseek(
  messages: { role: string; content: string }[],
  temperature = 0,
): Promise<string> {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-v4-flash",
      thinking: { type: "disabled" },
      temperature,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function searchProperties(
  filters: PropertyFilters,
  allCities: City[],
  allCategories: Category[],
) {
  const hasPrice =
    (filters.priceMin !== null && filters.priceMin !== undefined) ||
    (filters.priceMax !== null && filters.priceMax !== undefined);
  const hasArea =
    (filters.areaMin !== null && filters.areaMin !== undefined) ||
    (filters.areaMax !== null && filters.areaMax !== undefined);

  const properties = await prisma.property.findMany({
    where: {
      ...(filters.neighborhood && {
        neighborhood: { equals: filters.neighborhood, mode: "insensitive" },
      }),
      ...(filters.rooms !== null &&
        filters.rooms !== undefined && {
          rooms: { gte: filters.rooms },
        }),
      ...(filters.bathrooms !== null &&
        filters.bathrooms !== undefined && {
          bathrooms: { gte: filters.bathrooms },
        }),
      ...(hasPrice && {
        price: {
          ...(filters.priceMin !== null &&
            filters.priceMin !== undefined && { gte: filters.priceMin }),
          ...(filters.priceMax !== null &&
            filters.priceMax !== undefined && { lte: filters.priceMax }),
        },
      }),
      ...(filters.forSale !== null &&
        filters.forSale !== undefined && {
          forSale: filters.forSale,
        }),

      ...(hasArea && {
        area: {
          ...(filters.areaMin !== null &&
            filters.areaMin !== undefined && { gte: filters.areaMin }),
          ...(filters.areaMax !== null &&
            filters.areaMax !== undefined && { lte: filters.areaMax }),
        },
      }),

      ...(filters.sellerId && { sellerId: filters.sellerId }),
    },
    include: {
      propertyType: true,
      seller: { select: { id: true, name: true, phone: true, avatar: true } },
      media: true,
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 20,
  });

  const userPickedCities =
    filters.cities != null &&
    filters.cities.length > 0 &&
    filters.cities.length < allCities.length;

  const userPickedCategories =
    filters.categories != null &&
    filters.categories.length > 0 &&
    filters.categories.length < allCategories.length;

  if (!userPickedCities && !userPickedCategories) {
    return properties.slice(0, 10);
  }

  const maxRank = 9999;

  const cityRank: Record<string, number> = userPickedCities
    ? Object.fromEntries(
        (filters.cities ?? []).map((c, i) => [c.toLowerCase(), i]),
      )
    : {};

  const categoryRank: Record<string, number> = userPickedCategories
    ? Object.fromEntries(
        (filters.categories ?? []).map((c, i) => [c.toLowerCase(), i]),
      )
    : {};

  const scored = properties.map((p) => {
    const city = (p as { city?: string }).city?.toLowerCase() ?? "";
    const slug =
      (
        p as { propertyType?: { slug?: string } }
      ).propertyType?.slug?.toLowerCase() ?? "";

    const cityScore = userPickedCities ? (cityRank[city] ?? maxRank) : 0;
    const catScore = userPickedCategories ? (categoryRank[slug] ?? maxRank) : 0;
    const featuredScore = (p as { featured?: boolean }).featured ? -1 : 0;

    return { property: p, score: featuredScore + cityScore + catScore };
  });

  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, 10).map((s) => s.property);
}

export async function llmAnalyze(text: string, whatsappUserId?: string) {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid text");
  }

  const [categories, cities] = await Promise.all([
    getCategories(),
    getCities(),
  ]);

  // If we have a whatsapp user id, fetch recent messages and generate a short memory
  let memorySummary: string | null = null;
  if (whatsappUserId) {
    try {
      const recent = await prisma.whatsappMessage.findMany({
        where: { whatsappUserId },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      if (recent && recent.length) {
        const history = recent
          .slice()
          .reverse()
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n");

        // Summarize recent messages into a short memory note
        try {
          const mem = await deepseek([
            {
              role: "system",
              content: `Summarize the following conversation into a short memory note (1-2 sentences). Keep the language the same as the messages and do not invent facts.`,
            },
            { role: "user", content: history },
          ]);

          memorySummary = mem?.trim() || null;

          if (memorySummary) {
            await prisma.whatsappUser.update({
              where: { id: whatsappUserId },
              data: { memory: memorySummary },
            });
          }
        } catch (err) {
          console.error("Failed to create memory summary:", err);
        }
      }
    } catch (err) {
      console.error("Failed to load recent whatsapp messages:", err);
    }
  }

  const systemPromptBase =
    `You are a real-estate assistant from smssar company , Return ONLY valid JSON.
        you are work only in Moroccan and suppport all languages include maroccan language .
        
        Return format:
        {
        "role": "property_search" | "chat",
        "response": string | null,
        "fields": {
            "cities": string[] | null,
            "neighborhood": string | null,
            "categories": string[] | null,
            "priceMin": number | null,
            "priceMax": number | null,
            "rooms": number | null,
            "bathrooms": number | null,
            "forSale": boolean | null,
            "areaMin": number | null,
            "areaMax": number | null
          }
        }

        Rules:
        - i want response in the same language as user request
        - if role is not specified → role = chat
          if role is chat → response language should be the same as user request language, for example if user say hello in english → response should be in english and like that
        - If the user is asking for properties → role = property_search
        - If the user is asking for general information or help → role = chat
        - If request is unclear or ambiguous → role = chat
        - If unclear → role = chat
        - Return ONLY JSON`.trim();

  const systemPrompt = memorySummary
    ? `${systemPromptBase}\n\nUser memory: ${memorySummary}`
    : systemPromptBase;

  const step1Raw = await deepseek([
    { role: "system", content: systemPrompt },
    { role: "user", content: "user request: " + text },
  ]);

  const clean = step1Raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);

  if (parsed.role === "chat") {
    return {
      role: "chat",
      response: parsed.response ?? "How can I help you?",
    };
  }

  if (parsed.role === "property_search") {
    const filters = parsed.fields;

    const properties = await searchProperties(filters, cities, categories);

    if (!properties.length) {
      return {
        role: "property_search",
        response: "Sorry, I couldn't find any properties matching your search.",
        filters,
        properties: [],
      };
    }

    console.log("Found properties:", properties.length, "filters:", filters);

    const summary = await deepseek([
      {
        role: "system",
        content: `
            You are a real-estate assistant.
            respond in the language of the user request.
            Summarize results under 80 words.
            No markdown.
            No invented data.
            Reply in user language.
        `.trim(),
      },
      {
        role: "user",
        content: JSON.stringify(properties),
      },
      {
        role: "user",
        content: "user request: " + text,
      },
    ]);

    return {
      role: "property_search",
      response: summary,
      filters,
      properties,
    };
  }

  return {
    role: "unknown",
    response: "I couldn't understand your request.",
  };
}
