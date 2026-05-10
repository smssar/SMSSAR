"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ClientSubmitButton from "@/components/auth/client-submit-button";

export default function ResetPasswordClientForm({
  email = "",
  token = "",
  locale = "en",
}: {
  email?: string;
  token?: string;
  locale?: string;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/${locale}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password, confirmPassword }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = payload?.error || payload?.message || `Error ${res.status}`;
        toast.error(msg);
        setLoading(false);
        return;
      }

      const redirectTo = payload?.redirect || `/${locale}/login?reset=1`;
      router.push(redirectTo);
    } catch (err) {
      console.error(err);
      toast.error("Request failed");
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <input type="hidden" name="email" value={email ?? ""} />
      <input type="hidden" name="token" value={token ?? ""} />

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      <ClientSubmitButton className="w-full" type="submit" disabled={loading}>
        {locale === "ar"
          ? "تحديث"
          : locale === "fr"
            ? "Mettre à jour"
            : "Update"}
      </ClientSubmitButton>
    </form>
  );
}
