import { prisma } from "@/lib/prisma";

export async function ensureFreePlan() {
  return prisma.plan.upsert({
    where: { id: "plan_free" },
    update: {},
    create: {
      id: "plan_free",
      title: "Free",
      title_ar: "مجاني",
      title_fr: "Gratuit",
      description: "Free plan",
      description_ar: "الخطة المجانية",
      description_fr: "Forfait gratuit",
      price: 0,
      listings: null,
      featured: false,
    },
  });
}
