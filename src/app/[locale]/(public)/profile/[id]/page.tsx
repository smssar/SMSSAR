import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/locales";
import { formatPhoneDisplay } from "@/lib/phone";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      bio: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href={`/${locale}/properties`}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {locale === "ar" ? "العودة إلى العقارات" : "Back to properties"}
      </Link>

      <Card className="mt-6 border-border/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-violet-500" />
            {locale === "ar" ? "الملف العام" : "Public profile"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="text-sm text-muted-foreground">
              {locale === "ar" ? "الاسم" : "Name"}
            </div>
            <div className="mt-1 text-2xl font-semibold">{user.name}</div>
          </div>

          {user.city ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {user.city}
            </div>
          ) : null}

          {user.phone ? (
            <a
              href={`tel:${user.phone}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-violet-500"
            >
              <Phone className="h-4 w-4" />
              <span dir="ltr">{formatPhoneDisplay(user.phone)}</span>
            </a>
          ) : null}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            {user.email}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            {locale === "ar" ? "عضو منذ" : "Member since"}{" "}
            {new Date(user.createdAt).toLocaleDateString(locale)}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {locale === "ar" ? "مستخدم عام" : "Public user"}
            </Badge>
            <Badge variant="outline">{user.role}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
