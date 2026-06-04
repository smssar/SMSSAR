import { auth } from "@/auth";
import { jsonError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Authentication required.", 401);
  }

  try {
    const userPlan = await prisma.user.findUnique({
      where: { id: session?.user?.id },
      include: {
        plan: true,
      },
    });

    if (!userPlan) {
      return jsonError("User not found.", 404);
    }

    return new Response(JSON.stringify({ data: userPlan.plan }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching user plan:", error);
    return jsonError("Failed to fetch user plan.", 500);
  }
}
