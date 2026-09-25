"use client";

import { useState } from "react";

type NewsLanguageViewProps = {
  headline: string;
  summary: string;
  originalTitle: string;
  originalSummary: string | null;
};

type NewsLanguage = "en" | "ur";

export function NewsLanguageView({ headline, summary, originalTitle, originalSummary }: NewsLanguageViewProps) {
  const [language, setLanguage] = useState<NewsLanguage>("en");
  const isUrdu = language === "ur";

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-[var(--color-line-strong)] bg-[var(--color-mist)] p-0.5" role="group" aria-label="Article language">
          <LanguageButton active={!isUrdu} label="English" onClick={() => setLanguage("en")} />
          <LanguageButton active={isUrdu} label="اردو" onClick={() => setLanguage("ur")} />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">{isUrdu ? "Original" : "CHAYTHRAAR"}</span>
      </div>
      <div className="mt-4" lang={isUrdu ? "ur" : "en"} dir={isUrdu ? "rtl" : "ltr"}>
        <h2 className={isUrdu ? "font-urdu text-right text-xl font-semibold leading-10 text-[var(--color-ink)]" : "text-xl font-semibold leading-7 tracking-[-0.025em] text-[var(--color-ink)]"}>{isUrdu ? originalTitle : headline}</h2>
        <p className={isUrdu ? "font-urdu mt-3 text-right text-sm leading-8 text-[var(--color-slate)]" : "mt-3 line-clamp-4 text-sm leading-6 text-[var(--color-slate)]"}>{isUrdu ? originalSummary ?? "Original Urdu excerpt unavailable." : summary}</p>
      </div>
    </div>
  );
}

function LanguageButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={active ? "rounded-full bg-[var(--color-ink)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)] focus-visible:ring-offset-1" : "rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--color-slate)] transition-colors hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)] focus-visible:ring-offset-1"}>{label}</button>;
}
