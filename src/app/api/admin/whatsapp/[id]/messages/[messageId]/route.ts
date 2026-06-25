import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api-utils";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Authentication required.", 401);
  if (session.user.role !== "ADMIN") {
    return jsonError("Only admins can delete messages.", 403);
  }

  const { id, messageId } = await params;
  if (!id || !messageId) return jsonError("Message id is required.", 400);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const message = await tx.whatsappMessage.findUnique({
        where: { id: messageId },
        select: { id: true, whatsappUserId: true },
      });

      if (!message || message.whatsappUserId !== id) return null;

      const user = await tx.whatsappUser.findUnique({
        where: { id },
        select: { totalMessages: true },
      });

      await tx.whatsappMessage.delete({ where: { id: messageId } });

      const nextTotalMessages = Math.max(0, (user?.totalMessages ?? 0) - 1);
      await tx.whatsappUser.update({
        where: { id },
        data: { totalMessages: nextTotalMessages },
      });

      return { totalMessages: nextTotalMessages };
    });

    if (!result) return jsonError("Message not found.", 404);
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Failed to delete whatsapp message:", error);
    return jsonError("Failed to delete message.", 500);
  }
}
