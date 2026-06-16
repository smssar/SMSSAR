import { prisma } from "./prisma";

export async function getWhatsappUser(phoneNumber: string) {
  let user = await prisma.whatsappUser.findUnique({
    where: {
      phoneNumber,
    },
  });

  if (!user) {
    user = await prisma.whatsappUser.create({
      data: {
        phoneNumber,
        language: "ar",
      },
    });
  }

  return user;
}

export async function addWhatsappMessage(
  whatsappUserId: string,
  role: "user" | "assistant" | "system",
  content: string,
  options?: {
    tokens?: number;
    model?: string;
  },
) {
  return await prisma.whatsappMessage.create({
    data: {
      whatsappUserId,
      role,
      content,
      tokens: options?.tokens,
      model: options?.model,
    },
  });
}

export async function getLastWhatsappMessages(
  whatsappUserId: string,
  limit = 5,
) {
  return prisma.whatsappMessage.findMany({
    where: { whatsappUserId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function updateWhatsappMemory(
  whatsappUserId: string,
  memory: string | null,
) {
  return prisma.whatsappUser.update({
    where: { id: whatsappUserId },
    data: { memory },
  });
}
