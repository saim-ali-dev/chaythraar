export type NewsSummarizationInput = {
  originalTitle: string;
  sourceDescription: string | null;
  originalLanguage: string;
  sourceName: string;
};

export type NewsSummarizationResult = {
  headline: string;
  summary_short: string;
  original_language: string;
};

export type SafetySummarizationInput = {
  title: string;
  sourceContent: string;
  sourceName: string;
  sourceType: "official" | "news" | "community";
  locationName: string | null;
};

export function isNewsSummarizationConfigured() {
  return Boolean(process.env.NEWS_AI_API_KEY && process.env.NEWS_AI_API_URL && process.env.NEWS_AI_MODEL);
}

export async function summarizeNews(input: NewsSummarizationInput): Promise<NewsSummarizationResult | null> {
  const apiKey = process.env.NEWS_AI_API_KEY;
  const apiUrl = process.env.NEWS_AI_API_URL;
  const model = process.env.NEWS_AI_MODEL;
  if (!apiKey || !apiUrl || !model) return null;

  const content = await requestSummaryContent({
    apiKey,
    apiUrl,
    model,
    systemPrompt: "You create concise original news metadata for CHAYTHRAAR. Return JSON only with headline, summary_short, and original_language. Be factual, neutral, non-sensational, and use original wording. Do not invent facts or opinions. Preserve names, places, dates, numbers, and organizations accurately. Do not reproduce source text or the full article. The headline should be approximately 8-15 words. The summary should be approximately 25-45 words and one or two sentences.",
    userPayload: {
      source_name: input.sourceName,
      original_language: input.originalLanguage,
      original_title: input.originalTitle,
      source_description_or_excerpt: input.sourceDescription,
    },
  });

  return parseSummarization(content, input.originalLanguage);
}

export async function summarizeSafety(input: SafetySummarizationInput): Promise<NewsSummarizationResult | null> {
  const apiKey = process.env.NEWS_AI_API_KEY;
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

  return parseSummarization(content, "en");
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
    original_language: typeof parsed.original_language === "string" && parsed.original_language.trim() ? parsed.original_language.trim() : fallbackLanguage,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
