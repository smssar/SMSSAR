import { cn } from "@/lib/utils";
import type {
  ButtonHTMLAttributes,
  AnchorHTMLAttributes,
  ReactNode,
} from "react";

type Variant =
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "accent"
  | "destructive";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  default: "bg-primary text-primary-foreground shadow-sm hover:opacity-90",
  secondary: "bg-muted text-foreground hover:bg-muted/80",
  outline: "border border-border bg-background hover:bg-muted/60",
  ghost: "hover:bg-muted/60",
  accent:
    "bg-violet-500 from-primary-500 to-secondary-600 text-white shadow-lg hover:opacity-95",
  destructive:
    "bg-red-600 text-white shadow-sm hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

const base =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function buttonClassName({
  variant = "default",
  size = "md",
  className,
}: Partial<ButtonProps> & { className?: string }) {
  return cn(base, variantClasses[variant], sizeClasses[size], className);
}

export function Button({
  variant = "default",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClassName({ variant, size, className })}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "default",
  size = "md",
  className,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}) {
  return (
    <a className={buttonClassName({ variant, size, className })} {...props}>
      {children}
    </a>
  );
}
