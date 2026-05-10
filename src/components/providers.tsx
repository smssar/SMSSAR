"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { Toaster } from "sonner";
import type { ReactNode } from "react";
import { LocaleSync } from "./locale-sync";
import { SafePerformance } from "@/components/perf/safe-performance";

export function Providers({
  children,
  session,
}: {
  children: ReactNode;
  session?: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <SafePerformance />
      <LocaleSync />
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          className:
            "rounded-2xl border border-border/70 bg-card text-card-foreground shadow-xl",
        }}
      />
    </SessionProvider>
  );
}
