import { LoaderCircle } from "lucide-react";

export function LoadingState({ label }: { label: string }) {
  return (
    <section className="border-y border-[var(--color-line-strong)] py-8" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-sm font-medium text-[var(--color-slate)]">
        <LoaderCircle className="size-4 animate-spin text-[var(--color-copper-deep)]" aria-hidden="true" />
        <span>Loading {label}...</span>
      </div>
      <div className="mt-4 h-1 max-w-xl animate-pulse bg-[var(--color-mist)]" aria-hidden="true" />
    </section>
  );
}