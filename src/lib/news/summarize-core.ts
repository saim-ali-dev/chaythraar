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

export function isNewsSummarizationConfigured() {
  return Boolean(process.env.NEWS_AI_API_KEY && process.env.NEWS_AI_API_URL && process.env.NEWS_AI_MODEL);
}

export async function summarizeNews(input: NewsSummarizationInput): Promise<NewsSummarizationResult | null> {
  const apiKey = process.env.NEWS_AI_API_KEY;
  const apiUrl = process.env.NEWS_AI_API_URL;
  const model = process.env.NEWS_AI_MODEL;
  if (!apiKey || !apiUrl || !model) return null;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You create concise original news metadata for CHAYTHRAAR. Return JSON only with headline, summary_short, and original_language. Be factual, neutral, non-sensational, and use original wording. Do not invent facts or opinions. Preserve names, places, dates, numbers, and organizations accurately. Do not reproduce source text or the full article. The headline should be approximately 8-15 words. The summary should be approximately 25-45 words and one or two sentences.",
        },
        {
          role: "user",
          content: JSON.stringify({
            source_name: input.sourceName,
            original_language: input.originalLanguage,
            original_title: input.originalTitle,
            source_description_or_excerpt: input.sourceDescription,
          }),
        },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) throw new Error(`News summarization provider returned HTTP ${response.status}.`);

  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("News summarization provider returned no structured content.");

  return parseSummarization(content, input.originalLanguage);
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
