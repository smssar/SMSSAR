"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { Locale } from "@/lib/locales";

export function GoogleSignInButton({
  locale,
  callbackUrl,
}: {
  locale: Locale;
  callbackUrl?: string;
}) {
  const [loading, setLoading] = useState(false);
  const handleGoogleSignIn = () => {
    setLoading(true);
    void signIn("google", callbackUrl ? { callbackUrl } : undefined);
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full cursor-pointer"
      onClick={handleGoogleSignIn}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 533.5 544.3" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M533.5 278.4c0-18.8-1.5-37-4.3-54.6H272.1v103.4h147.3c-6.3 34.1-25.1 62.9-53.6 82v68.1h86.5c50.6-46.6 80.2-115.5 80.2-199z"
          />
          <path
            fill="#34A853"
            d="M272.1 544.3c72.6 0 133.6-24.1 178-65.6l-86.5-68.1c-24.1 16.2-55 25.7-91.5 25.7-70.4 0-130-47.4-151.2-111.4H29.4v69.8C73.7 486.6 167.4 544.3 272.1 544.3z"
          />
          <path
            fill="#FBBC05"
            d="M120.9 323.0c-10.8-32.4-10.8-67.3 0-99.7V153.5H29.4c-40.3 78.1-40.3 171.2 0 249.3l91.5-79.8z"
          />
          <path
            fill="#EA4335"
            d="M272.1 109.6c39.6 0 75.2 13.6 103.3 40.3l77.4-77.4C420.4 24.1 359.4 0 272.1 0 167.4 0 73.7 57.7 29.4 153.5l91.5 69.8c21.2-64 80.8-111.4 151.2-111.4z"
          />
        </svg>
      )}
      <span>
        {locale === "ar" ? "تسجيل الدخول باستخدام جوجل" : "Sign in with Google"}
      </span>
    </Button>
  );
}
