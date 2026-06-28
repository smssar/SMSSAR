import { SellerProfilePanel } from "@/components/seller/seller-profile-panel";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";

export default async function SmssarProfilePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const messages = getMessages(locale);
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const sellerRecord = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      bio: true,
      createdAt: true,
      passwordHash: true,
    },
  });

  if (!sellerRecord) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {messages.dashboard.seller.profile}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {locale === "ar"
            ? "حدِّث بيانات البائع والمعلومات العامة."
            : "Update seller profile and public contact details."}
        </p>
      </div>
      <SellerProfilePanel
        locale={locale}
        initialSeller={{
          id: sellerRecord.id,
          name: sellerRecord.name ?? "",
          email: sellerRecord.email ?? "",
          phone: sellerRecord.phone ?? "",
          city: sellerRecord.city ?? "",
          bio: sellerRecord.bio ?? "",
          createdAt: sellerRecord.createdAt,
          hasPassword: Boolean(sellerRecord.passwordHash),
        }}
      />
    </div>
  );
}
