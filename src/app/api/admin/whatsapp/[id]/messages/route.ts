import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { jsonError } from "@/lib/api-utils";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Authentication required.", 401);
  if (session.user.role !== "ADMIN")
    return jsonError("Only admins can view messages.", 403);

  const { id } = await params;
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10) || 1;
  const pageSize = Math.min(
    100,
    Math.max(5, parseInt(url.searchParams.get("pageSize") || "25", 10) || 25),
  );
  const search = (url.searchParams.get("search") || "").trim();

  const where: Prisma.WhatsappMessageWhereInput = { whatsappUserId: id };
  if (search) {
    where.content = { contains: search, mode: "insensitive" } as
      | Prisma.StringFilter
      | undefined;
  }

  const [totalCount, messages] = await Promise.all([
    prisma.whatsappMessage.count({ where }),
    prisma.whatsappMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: {
        id: true,
        role: true,
        content: true,
        tokens: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    data: messages,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  });
}
