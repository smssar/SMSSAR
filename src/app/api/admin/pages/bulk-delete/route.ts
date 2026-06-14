import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { ids } = await req.json();
  if (!Array.isArray(ids))
    return NextResponse.json({ ok: false }, { status: 400 });
  await prisma.page.deleteMany({ where: { id: { in: ids } } });
  return NextResponse.json({ ok: true });
}
