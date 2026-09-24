import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-[var(--color-ink)] text-white hover:bg-[var(--color-slate)]",
        variant === "secondary" && "border border-[var(--color-line-strong)] bg-white text-[var(--color-ink)] hover:border-[var(--color-copper)] hover:text-[var(--color-copper)]",
        variant === "ghost" && "text-[var(--color-slate)] hover:bg-[var(--color-sand)] hover:text-[var(--color-ink)]",
        className,
      )}
      {...props}
    />
  );
}
