"use client";

import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Undo2, Loader2, AlertTriangle } from "lucide-react";

export function RefundButton({
  paymentId,
  subscriptionId,
  cancelText,
  partialAmountLabel,
  partialAmountHelp,
  partialAmountPlaceholder,
  confirmText,
  successText,
  errorText,
  processingText,
  refundText,
}: {
  paymentId: string;
  subscriptionId: string;
  cancelText: string;
  partialAmountLabel: string;
  partialAmountHelp: string;
  partialAmountPlaceholder: string;
  confirmText: string;
  successText: string;
  errorText: string;
  processingText: string;
  refundText: string;
}) {
  const [loading, setLoading] = React.useState(false);
  const [openConfirm, setOpenConfirm] = React.useState(false);
  const [partialAmount, setPartialAmount] = React.useState("");

  async function handleRefund() {
    const parsedPartialAmount =
      partialAmount.trim() === "" ? undefined : Number(partialAmount);

    if (
      parsedPartialAmount !== undefined &&
      (!Number.isFinite(parsedPartialAmount) || parsedPartialAmount <= 0)
    ) {
      toast.error("Partial refund amount must be greater than 0");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/refunds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          subscriptionId,
          partialAmount:
            parsedPartialAmount !== undefined
              ? parsedPartialAmount * 10
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detailedMessage = [
          typeof data?.error === "string" ? data.error : null,
          typeof data?.detail === "string" ? data.detail : null,
          typeof data?.dodo?.message === "string" ? data.dodo.message : null,
        ]
          .filter(Boolean)
          .join(" - ");

        throw new Error(detailedMessage || errorText);
      }
      toast.success(successText);
      // reload to show updated status
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : errorText);
    } finally {
      setLoading(false);
    }
  }

  function closeConfirm() {
    if (loading) return;
    setPartialAmount("");
    setOpenConfirm(false);
  }

  return (
    <>
      <Button
        onClick={() => setOpenConfirm(true)}
        variant="destructive"
        disabled={loading}
        size="lg"
        className="gap-2 rounded-full shadow-sm transition-shadow hover:shadow-md"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {processingText}
          </>
        ) : (
          <>
            <Undo2 className="h-4 w-4" />
            {refundText}
          </>
        )}
      </Button>

      {openConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-md"
            onClick={closeConfirm}
          />
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-border/60 bg-background shadow-[0_24px_80px_-24px_rgba(0,0,0,0.55)]">
            <div className="h-2 bg-linear-to-r from-destructive via-destructive/80 to-amber-500" />

            <div className="p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/10">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold tracking-tight">
                    {refundText}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {confirmText}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-border/60 bg-muted/30 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">
                      {partialAmountLabel}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {partialAmountHelp}
                    </div>
                  </div>
                  <div className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
                    Optional
                  </div>
                </div>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder={partialAmountPlaceholder}
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  disabled={loading}
                  className="h-11 rounded-xl bg-background"
                />
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  variant="ghost"
                  onClick={closeConfirm}
                  disabled={loading}
                  className="w-full rounded-full sm:w-auto"
                >
                  {cancelText}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRefund}
                  disabled={loading}
                  className="w-full gap-2 rounded-full sm:w-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {processingText}
                    </>
                  ) : (
                    <>
                      <Undo2 className="h-4 w-4" />
                      {refundText}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
