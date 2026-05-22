"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function CancelButton({
  label = "Cancel",
  confirmMessage = "Are you sure you want to cancel your subscription?",
  successMessage = "Subscription CANCELLED.",
  errorMessage = "Failed to cancel subscription",
  confirmTitle = "Confirm cancellation",
  cancelActionLabel = "Keep subscription",
  confirmActionLabel = "Cancel subscription",
}: {
  label?: string;
  confirmMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  confirmTitle?: string;
  cancelActionLabel?: string;
  confirmActionLabel?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [statusKind, setStatusKind] = React.useState<
    "success" | "error" | null
  >(null);

  async function confirmCancel() {
    setLoading(true);
    setStatusMessage(null);
    setStatusKind(null);
    try {
      const res = await fetch("/api/subscriptions/cancel", { method: "POST" });
      setLoading(false);
      setOpen(false);
      if (res.ok) {
        setStatusKind("success");
        setStatusMessage(successMessage);
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        setStatusKind("error");
        setStatusMessage(data?.error || errorMessage);
      }
    } catch {
      setLoading(false);
      setStatusKind("error");
      setStatusMessage(errorMessage);
    }
  }

  return (
    <div className="relative inline-block">
      <Button
        variant="outline"
        onClick={() => {
          setStatusMessage(null);
          setStatusKind(null);
          setOpen(true);
        }}
        disabled={loading}
      >
        {loading ? `${label}...` : label}
      </Button>

      {statusMessage ? (
        <div
          className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
            statusKind === "success"
              ? "border-emerald-300/60 bg-emerald-50 text-emerald-800 dark:border-emerald-700/60 dark:bg-emerald-900/20 dark:text-emerald-300"
              : "border-rose-300/60 bg-rose-50 text-rose-800 dark:border-rose-700/60 dark:bg-rose-900/20 dark:text-rose-300"
          }`}
        >
          {statusMessage}
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={() => {
              if (!loading) setOpen(false);
            }}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border/70 bg-background p-6 shadow-2xl">
            <h3 className="text-lg font-semibold tracking-tight">
              {confirmTitle}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {confirmMessage}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {cancelActionLabel}
              </Button>
              <Button
                variant="destructive"
                onClick={confirmCancel}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? `${confirmActionLabel}...` : confirmActionLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
