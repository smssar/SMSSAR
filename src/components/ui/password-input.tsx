"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { InputHTMLAttributes } from "react";

export function PasswordInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-4" />
      <Input
        type={showPassword ? "text" : "password"}
        className={`pl-11 pr-11 rtl:pl-11 rtl:pr-11 ${className || ""}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="pointer-events-auto cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition rtl:left-4 rtl:right-auto"
        tabIndex={-1}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
