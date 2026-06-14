"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, id, checked, defaultChecked, onChange, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        id={id}
        ref={ref}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        className={cn(
          "h-4 w-4 shrink-0 rounded border border-input text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 accent-violet-600",
          className,
        )}
        {...props}
      />
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
