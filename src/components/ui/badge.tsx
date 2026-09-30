import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "copper" | "green" | "critical" | "high";
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]",
        tone === "neutral" && "bg-[var(--color-mist)] text-[var(--color-slate)]",
        tone === "copper" && "bg-[var(--color-copper-soft)] text-[var(--color-copper-deep)]",
        tone === "green" && "bg-[var(--color-green-soft)] text-[var(--color-green-deep)]",
        tone === "critical" && "bg-[var(--color-danger-soft)] text-[var(--color-danger-deep)]",
        tone === "high" && "bg-[var(--color-caution-soft)] text-[var(--color-caution-deep)]",
        className,
      )}
      {...props}
    />
  );
}
