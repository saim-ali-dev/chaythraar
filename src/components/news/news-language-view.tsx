"use client";

import { useState } from "react";
import { NEWS_LANGUAGES, resolveNewsLanguageContent, type NewsLanguage } from "@/lib/news/language";
import type { NewsEntry } from "@/types/content";

type NewsLanguageViewProps = {
  entry: NewsEntry;
};

export function NewsLanguageView({ entry }: NewsLanguageViewProps) {
  const [language, setLanguage] = useState<NewsLanguage>("en");
  const isUrdu = language === "ur";
  const content = resolveNewsLanguageContent(entry, language);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-[var(--color-line-strong)] bg-[var(--color-mist)] p-0.5" role="group" aria-label="Article language">
          {NEWS_LANGUAGES.map((option) => <LanguageButton key={option.code} active={language === option.code} label={option.label} onClick={() => setLanguage(option.code)} />)}
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">{isUrdu ? "Urdu" : "English"}</span>
      </div>
      <div className="mt-4" lang={content.language} dir={isUrdu ? "rtl" : "ltr"}>
        <h2 className={isUrdu ? "font-urdu text-right text-xl font-semibold leading-10 text-[var(--color-ink)]" : "text-xl font-semibold leading-7 tracking-[-0.025em] text-[var(--color-ink)]"}>{content.headline}</h2>
        <p className={isUrdu ? "font-urdu mt-3 text-right text-sm leading-8 text-[var(--color-slate)]" : "mt-3 line-clamp-4 text-sm leading-6 text-[var(--color-slate)]"}>{content.summary}</p>
      </div>
    </div>
  );
}

function LanguageButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={active ? "min-h-11 rounded-md bg-[var(--color-ink)] px-3 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)] focus-visible:ring-offset-1" : "min-h-11 rounded-md px-3 text-xs font-semibold text-[var(--color-slate)] transition-colors hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)] focus-visible:ring-offset-1"}>{label}</button>;
}
