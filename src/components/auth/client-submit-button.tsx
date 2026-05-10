"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

export default function ClientSubmitButton({
  children,
  className,
  disabled,
  ...props
}: ButtonProps & { children: React.ReactNode; className?: string }) {
  return (
    <Button
      {...props}
      variant="accent"
      className={className}
      disabled={disabled}
    >
      {disabled ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle2 className="h-4 w-4" />
      )}
      {children}
    </Button>
  );
}
