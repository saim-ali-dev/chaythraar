export type NewsLanguage = "en" | "ur";

export const NEWS_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ur", label: "اردو" },
] as const satisfies readonly { code: NewsLanguage; label: string }[];

export type NewsLanguageEntry = {
  title: string;
  original_title: string | null;
  original_language: string | null;
  summary: string | null;
  headline: string | null;
  summary_short: string | null;
  headline_ur?: string | null;
  summary_short_ur?: string | null;
};

export type NewsLanguageContent = {
  language: NewsLanguage;
  headline: string;
  summary: string;
};

type LanguageCandidate = {
  value: string | null | undefined;
  urduTranslation?: boolean;
};

export function resolveNewsLanguageContent(entry: NewsLanguageEntry, language: NewsLanguage): NewsLanguageContent {
  const originalTitle = entry.original_title ?? entry.title;
  const headlineCandidates = language === "en"
    ? [{ value: entry.headline }, { value: originalTitle }, { value: entry.title }]
    : [
      { value: entry.headline_ur, urduTranslation: true },
      { value: originalTitle },
      { value: entry.headline },
      { value: entry.title },
    ];
  const summaryCandidates = language === "en"
    ? [{ value: entry.summary_short }, { value: entry.summary }]
    : [
      { value: entry.summary_short_ur, urduTranslation: true },
      { value: entry.summary },
      { value: entry.summary_short },
    ];
  const fallback = language === "en" ? "English translation unavailable." : "اردو ترجمہ دستیاب نہیں۔";

  return {
    language,
    headline: firstLanguageMatch(headlineCandidates, language) ?? fallback,
    summary: firstLanguageMatch(summaryCandidates, language) ?? fallback,
  };
}

export function detectNewsTextLanguage(value: string | null | undefined): NewsLanguage | "mixed" | "unknown" {
  if (!value) return "unknown";

  let latinLetters = 0;
  let urduLetters = 0;
  for (const character of value) {
    if (/\p{Script=Latin}/u.test(character)) latinLetters += 1;
    if (/\p{Script=Arabic}/u.test(character)) urduLetters += 1;
  }

  if (latinLetters === 0 && urduLetters === 0) return "unknown";
  if (latinLetters === 0) return "ur";
  if (urduLetters === 0) return "en";
  if (latinLetters > urduLetters * 1.5) return "en";
  if (urduLetters > latinLetters * 1.5) return "ur";
  return "mixed";
}

function firstLanguageMatch(
  candidates: LanguageCandidate[],
  language: NewsLanguage,
): string | null {
  const matches = (candidate: LanguageCandidate) => {
    if (!candidate.value?.trim()) return false;
    if (language === "ur" && candidate.urduTranslation) return /\p{Script=Arabic}/u.test(candidate.value);
    return detectNewsTextLanguage(candidate.value) === language;
  };
  return candidates.find(matches)?.value?.trim() ?? null;
}