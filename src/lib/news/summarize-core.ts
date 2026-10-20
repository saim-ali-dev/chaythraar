export type NewsSummarizationInput = {
  originalTitle: string;
  sourceDescription: string | null;
  originalLanguage: string;
  sourceName: string;
  existingHeadline?: string | null;
  existingSummaryShort?: string | null;
};

export type NewsSummarizationResult = {
  headline: string;
  summary_short: string;
  headline_ur: string | null;
  summary_short_ur: string | null;
  original_language: string;
};

export type SafetySummarizationResult = Pick<NewsSummarizationResult, "headline" | "summary_short" | "original_language">;

export type SafetySummarizationInput = {
  title: string;
  sourceContent: string;
  sourceName: string;
  sourceType: "official" | "news" | "community";
  locationName: string | null;
};

export type AssistantCompletionInput = {
  systemPrompt: string;
  userPayload: Record<string, unknown>;
};

export function isNewsSummarizationConfigured() {
  return Boolean(process.env.GROQ_API_KEY && process.env.NEWS_AI_API_URL && process.env.NEWS_AI_MODEL);
}

export async function summarizeNews(input: NewsSummarizationInput): Promise<NewsSummarizationResult | null> {
  const apiKey = process.env.GROQ_API_KEY;
  const apiUrl = process.env.NEWS_AI_API_URL;
  const model = process.env.NEWS_AI_MODEL;
  if (!apiKey || !apiUrl || !model) return null;

  const content = await requestSummaryContent({
    apiKey,
    apiUrl,
    model,
    systemPrompt: "You create concise bilingual news metadata for CHAYTHRAAR. Return JSON only with headline, summary_short, headline_ur, summary_short_ur, and original_language. headline and summary_short must be in English. headline_ur and summary_short_ur must be faithful Urdu translations written in Urdu script. Be factual, neutral, and non-sensational. Do not invent facts or reproduce the full source. Preserve names, places, dates, numbers, and organizations accurately. The headline should be approximately 8-15 words. The summary should be approximately 25-45 words and one or two sentences. If existing English headline or summary fields are supplied and are already in English, retain their meaning and wording rather than generating replacements.",
    userPayload: {
      source_name: input.sourceName,
      original_language: input.originalLanguage,
      original_title: input.originalTitle,
      source_description_or_excerpt: input.sourceDescription,
      existing_english_headline: input.existingHeadline,
      existing_english_summary: input.existingSummaryShort,
    },
  });

  return parseSummarization(content, input.originalLanguage);
}

export async function summarizeSafety(input: SafetySummarizationInput): Promise<SafetySummarizationResult | null> {
  const apiKey = process.env.GROQ_API_KEY;
  const apiUrl = process.env.NEWS_AI_API_URL;
  const model = process.env.NEWS_AI_MODEL;
  if (!apiKey || !apiUrl || !model) return null;

  const content = await requestSummaryContent({
    apiKey,
    apiUrl,
    model,
    systemPrompt: "You create grounded CHAYTHRAAR Safety briefs. Return JSON only with headline, summary_short, and original_language. The headline must be approximately 8-15 words and the summary 25-60 words in one to three sentences. Use only facts explicitly present in source_content. Summarize only the Chitral-relevant portion and exclude unrelated regions. Include the hazard, affected period, stated impacts, or stated advice only when explicitly present. Do not invent severity, locations, dates, impacts, recommendations, or confirmation. Do not reproduce source wording verbatim. Keep news reports clearly unverified and preserve the source type distinction. If the content is insufficient, state only the facts that are present.",
    userPayload: {
      source_name: input.sourceName,
      source_type: input.sourceType,
      location_name: input.locationName,
      original_title: input.title,
      source_content: input.sourceContent,
    },
  });

  const result = parseSummarization(content, "en");
  return {
    headline: result.headline,
    summary_short: result.summary_short,
    original_language: result.original_language,
  };
}

export async function completeAssistantJson(input: AssistantCompletionInput): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  const apiUrl = process.env.NEWS_AI_API_URL;
  const model = process.env.NEWS_AI_MODEL;
  if (!apiKey || !apiUrl || !model) return null;

  return requestSummaryContent({
    apiKey,
    apiUrl,
    model,
    systemPrompt: input.systemPrompt,
    userPayload: input.userPayload,
  });
}

async function requestSummaryContent(input: {
  apiKey: string;
  apiUrl: string;
  model: string;
  systemPrompt: string;
  userPayload: Record<string, unknown>;
}): Promise<string> {
  const response = await fetch(input.apiUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${input.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: input.systemPrompt },
        { role: "user", content: JSON.stringify(input.userPayload) },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) throw new Error(`Safety summarization provider returned HTTP ${response.status}.`);

  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("Safety summarization provider returned no structured content.");
  return content;
}

function parseSummarization(content: string, fallbackLanguage: string): NewsSummarizationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("News summarization provider returned invalid JSON.");
  }

  if (!isRecord(parsed) || typeof parsed.headline !== "string" || typeof parsed.summary_short !== "string") {
    throw new Error("News summarization provider returned an incomplete response.");
  }

  const headline = parsed.headline.trim();
  const summary = parsed.summary_short.trim();
  if (!headline || !summary) throw new Error("News summarization provider returned empty generated fields.");

  return {
    headline,
    summary_short: summary,
    headline_ur: typeof parsed.headline_ur === "string" && parsed.headline_ur.trim() ? parsed.headline_ur.trim() : null,
    summary_short_ur: typeof parsed.summary_short_ur === "string" && parsed.summary_short_ur.trim() ? parsed.summary_short_ur.trim() : null,
    original_language: typeof parsed.original_language === "string" && parsed.original_language.trim() ? parsed.original_language.trim() : fallbackLanguage,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
