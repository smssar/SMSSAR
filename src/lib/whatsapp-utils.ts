import { prisma } from "./prisma";

export async function getWhatsappUser(phoneNumber: string) {
  // Retry helper for transient DB timeouts
  const runWithRetries = async <T>(
    fn: () => Promise<T>,
    retries = 2,
    delayMs = 300,
  ) => {
    let lastErr: unknown = null;
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        if (i < retries)
          await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
      }
    }
    throw lastErr;
  };

  let user = await runWithRetries(() =>
    prisma.whatsappUser.findUnique({
      where: {
        phoneNumber,
      },
    }),
  );

  if (!user) {
    user = await runWithRetries(() =>
      prisma.whatsappUser.create({
        data: {
          phoneNumber,
          language: "ar",
        },
      }),
    );
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
    externalId?: string | null;
  },
) {
  return await prisma.whatsappMessage.create({
    data: {
      whatsappUserId,
      role,
      content,
      tokens: options?.tokens,
      model: options?.model,
      externalId: options?.externalId ?? undefined,
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
