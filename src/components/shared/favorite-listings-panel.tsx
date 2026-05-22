import { auth } from "@/auth";
import { PropertyCard } from "@/components/property";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMessages } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/locales";
import { redirect } from "next/navigation";

type FavoriteProperty = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  city: string;
  neighborhood?: string;
  area: number;
  rooms: number;
  bathrooms: number;
  price: number;
  propertyType: string;
  featured: boolean;
  seller: string;
  media?: Array<{
    id: string;
    url: string;
    publicId: string;
    type: string;
  }>;
  isFavorite: boolean;
  favoriteEnabled: boolean;
};

export async function FavoriteListingsPanel({ locale }: { locale: Locale }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const messages = getMessages(locale);

  const favoriteRows = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      property: {
        include: {
          propertyType: { select: { name: true } },
          seller: { select: { name: true } },
          media: {
            select: { id: true, url: true, publicId: true, type: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  const favorites: FavoriteProperty[] = favoriteRows.map((item) => ({
    id: item.property.id,
    title: item.property.title,
    description: item.property.description || "",
    imageUrl: item.property.imageUrl || undefined,
    city: item.property.city,
    neighborhood: item.property.neighborhood || undefined,
    area: item.property.area || 0,
    rooms: item.property.rooms || 0,
    bathrooms: item.property.bathrooms || 0,
    price: item.property.price || 0,
    propertyType: item.property.propertyType?.name || "",
    featured: item.property.featured,
    seller: item.property.seller?.name || "Unknown",
    media: item.property.media.map((media) => ({
      id: media.id,
      url: media.url,
      publicId: media.publicId,
      type: media.type,
    })),
    isFavorite: true,
    favoriteEnabled: true,
  }));

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border/70 bg-linear-to-br from-violet-600/10 via-background to-fuchsia-600/10 p-6 sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {messages.dashboard.profile.favorites}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {messages.dashboard.profile.favoritesDescription}
        </p>
      </div>

      {favorites.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {favorites.map((property) => (
            <PropertyCard
              key={property.id}
              locale={locale}
              property={property}
            />
          ))}
        </div>
      ) : (
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>{messages.dashboard.profile.favorites}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 py-10 text-center text-muted-foreground">
            <p>{messages.dashboard.profile.favoritesEmpty}</p>
            <ButtonLink href={`/${locale}/properties`} variant="accent">
              {locale === "ar" ? "استكشف العقارات" : "Browse properties"}
            </ButtonLink>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
