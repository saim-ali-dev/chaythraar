const QUERY_NOISE_WORDS = new Set([
  "a",
  "an",
  "are",
  "can",
  "could",
  "did",
  "do",
  "does",
  "doing",
  "explain",
  "for",
  "from",
  "give",
  "how",
  "in",
  "i",
  "is",
  "it",
  "me",
  "mean",
  "means",
  "of",
  "say",
  "show",
  "tell",
  "the",
  "that",
  "this",
  "to",
  "translate",
  "translation",
  "what",
  "with",
  "word",
  "words",
  "would",
  "you",
  "about",
  "khowar",
]);

const DICTIONARY_INTENT = /\b(?:khowar|dictionary|glossary|lexicon|headword|translate|translation|pronunciation|meaning|means|mean|example|examples|phrase|word)\b/iu;

export function getKhowarGlossarySearchTerms(message: string): string[] {
  const words = message.normalize("NFKC").toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) ?? [];

  return Array.from(new Set(words.filter((word) => !QUERY_NOISE_WORDS.has(word)))).slice(0, 16);
}

export function isKhowarGlossaryQuestion(message: string): boolean {
  if (DICTIONARY_INTENT.test(message)) return true;

  const words = message.normalize("NFKC").match(/[\p{L}\p{M}\p{N}]+/gu) ?? [];
  return words.length > 0 && words.length <= 2;
}