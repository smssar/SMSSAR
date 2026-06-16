import { llmAnalyze } from "@/lib/llmBot";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    // 1. Validate input
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid text" },
        { status: 400 },
      );
    }

    // 2. Call AI + business logic
    const result = await llmAnalyze(text);

    // 3. Return response
    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ /api/analyze error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
