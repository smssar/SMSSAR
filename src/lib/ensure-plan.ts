import { prisma } from "@/lib/prisma";

export async function ensurePlan(planId: string) {
  if (!planId) return null;

  if (planId === "plan_free") {
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

  if (planId === "plan_pro") {
    return prisma.plan.upsert({
      where: { id: "plan_pro" },
      update: {},
      create: {
        id: "plan_pro",
        title: "Pro",
        title_ar: "برو",
        title_fr: "Pro",
        description: "Pro monthly plan",
        description_ar: "خطة برو الشهرية",
        description_fr: "Forfait Pro mensuel",
        price: 99,
        listings: null,
        featured: false,
      },
    });
  }

  if (planId === "plan_premium") {
    return prisma.plan.upsert({
      where: { id: "plan_premium" },
      update: {},
      create: {
        id: "plan_premium",
        title: "Premium",
        title_ar: "بريميوم",
        title_fr: "Premium",
        description: "Premium monthly plan",
        description_ar: "خطة بريميوم الشهرية",
        description_fr: "Forfait Premium mensuel",
        price: 190,
        listings: null,
        featured: true,
      },
    });
  }

  return null;
}
