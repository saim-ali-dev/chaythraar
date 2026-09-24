import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--color-line)] bg-white shadow-[0_18px_50px_rgba(25,40,54,0.06)]",
        className,
      )}
      {...props}
    />
  );
}
