import "server-only";

export const GEMINI_EMBEDDING_MODEL = "gemini-embedding-2";
const GEMINI_EMBEDDING_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent`;
export const GEMINI_EMBEDDING_DIMENSIONS = 1536;

export async function embedRagDocument(title: string, content: string): Promise<number[]> {
  const normalizedTitle = title.trim();
  const normalizedContent = content.trim();
  if (!normalizedContent) throw new Error("Embedding content must not be empty.");

  return requestEmbedding(`task: search result | title: ${normalizedTitle || "none"} | text: ${normalizedContent}`);
}

export async function embedRagQuery(query: string): Promise<number[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) throw new Error("Embedding query must not be empty.");

  return requestEmbedding(`task: search result | query: ${normalizedQuery}`);
}

async function requestEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini embedding is not configured.");

  const response = await fetch(GEMINI_EMBEDDING_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      embedContentConfig: { outputDimensionality: GEMINI_EMBEDDING_DIMENSIONS },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) throw new Error(`Gemini embedding provider returned HTTP ${response.status}.`);

  const payload = await response.json() as { embedding?: { values?: unknown } };
  const values = payload.embedding?.values;
  if (!Array.isArray(values) || values.length !== GEMINI_EMBEDDING_DIMENSIONS
    || !values.every((value) => typeof value === "number" && Number.isFinite(value))) {
    throw new Error("Gemini embedding provider returned an invalid vector.");
  }

  return values as number[];
}
