import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  variant?: "editorial" | "compact" | "operational";
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  variant = "editorial",
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-3xl">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-copper-deep)]">{eyebrow}</p>}
        <h1 className={cn(
          "mt-3 text-[var(--color-ink)]",
          variant === "editorial" && "font-editorial text-4xl leading-[1.08] sm:text-5xl",
          variant === "compact" && "text-3xl font-semibold leading-tight sm:text-4xl",
          variant === "operational" && "text-3xl font-semibold leading-tight sm:text-4xl",
        )}>{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-slate)] sm:text-base">{description}</p>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}