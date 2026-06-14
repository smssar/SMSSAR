import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Cached lookups ───────────────────────────────────────────────────────────
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

// ─── DeepSeek helper ──────────────────────────────────────────────────────────

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

// ─── Search + relevance sort ──────────────────────────────────────────────────

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

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid `text` field." },
        { status: 400 },
      );
    }

    const [categories, cities] = await Promise.all([
      getCategories(),
      getCities(),
    ]);

    const categoryList = categories
      .map((c) => `${c.name} (slug: ${c.slug})`)
      .join(", ");
    const cityList = cities.map((c) => c.name).join(", ");

    const step1Raw = await deepseek([
      {
        role: "system",
        content: `
        You are a real-estate assistant. Return ONLY valid JSON — no markdown, no explanation.

        Available cities (use exact names): ${cityList}
        Available categories (use the slug value): ${categoryList}

        JSON schema to return:
        {
          "role": "property_search" | "chat",
          "response": "string (only for role=chat, otherwise null)",
          "fields": {
            "cities": ["CityName", "..."] or null,
            "neighborhood": "string or null",
            "categories": ["slug", "..."] or null,
            "priceMin": number or null,
            "priceMax": number or null,
            "rooms": number or null,
            "bathrooms": number or null,
            "forSale": true | false | null,
            "areaMin": number or null,
            "areaMax": number or null,
          }
        }

        Rules:
        return responses depend user language (e.g. if user writes in Arabic, respond in Arabic)
        Greetings / general questions → role = "chat", fill "response", set "fields" to null
        Property requests → role = "property_search", fill "fields", set "response" to null
        If the user request is missing basic required information (e.g. no city, no location preference, no property type, or unclear search intent) → set role = "chat" and ask the user to provide the missing details in "response"
        Return ONLY the JSON object

        Cities rules:
        If the user mentions a specific city or region → return a list of up to 10 cities, with matching cities first, followed by the rest in original order
        If the user does NOT mention any city or region → return null (not the full list)

        Categories rules:
        If the user mentions a specific property type → return the full list of categories, with matching categories first, followed by the rest in original order.

        If the user does NOT mention any property type → return null.
        `.trim(),
      },
      { role: "user", content: text },
    ]);

    let parsed: {
      role: string;
      response?: string | null;
      fields?: PropertyFilters | null;
    };

    try {
      const clean = step1Raw.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      console.error("Failed to parse AI JSON:", step1Raw);
      return NextResponse.json(
        { error: "AI returned invalid JSON." },
        { status: 502 },
      );
    }

    if (parsed.role === "chat") {
      return NextResponse.json({
        role: "chat",
        response: parsed.response ?? "How can I help you?",
      });
    }

    if (parsed.role === "property_search") {
      console.log("Parsed filters from AI:", parsed.fields);
      const filters: PropertyFilters = (parsed.fields ??
        null) as PropertyFilters;

      const properties = await searchProperties(filters, cities, categories);

      if (!properties.length) {
        return NextResponse.json({
          role: "property_search",
          response:
            "Sorry, I couldn't find any properties matching your search.",
          filters,
          properties: [],
        });
      }

      type PropertyWithRelations = {
        title?: string;
        city?: string;
        neighborhood?: string;
        price?: number;
        rooms?: number;
        bathrooms?: number;
        forSale?: boolean;
        propertyType?: { name?: string };
      };

      const summary = await deepseek(
        [
          {
            role: "system",
            content: `
              You are a friendly real-estate assistant for a Moroccan property platform.
              Write a short, plain conversational summary (under 80 words) of the properties found.
              Rules:
              - All prices are in MAD (Moroccan Dirhams), display them as "X DH"
              - No markdown, no bullet points, no bold, no dashes
              - Mention only details relevant to what the user asked (city, price, rooms, etc.)
              - Reply in the same language the user wrote in
              - Do NOT invent any data
            `.trim(),
          },
          {
            role: "user",
            content: JSON.stringify(
              properties.map((p) => {
                const prop = p as PropertyWithRelations;
                return {
                  title: prop.title,
                  city: prop.city,
                  neighborhood: prop.neighborhood,
                  price: prop.price,
                  rooms: prop.rooms,
                  bathrooms: prop.bathrooms,
                  forSale: prop.forSale,
                  propertyType: prop.propertyType?.name,
                };
              }),
            ),
          },
        ],
        0.3,
      );

      return NextResponse.json({
        role: "property_search",
        response: summary,
        filters,
        properties,
      });
    }

    return NextResponse.json({
      role: "unknown",
      response: "I couldn't understand your request.",
    });
  } catch (error) {
    console.error("POST /api/analyze error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
