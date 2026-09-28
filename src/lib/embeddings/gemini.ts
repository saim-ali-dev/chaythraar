import "server-only";

export const GEMINI_EMBEDDING_MODEL = "gemini-embedding-2";
const GEMINI_EMBEDDING_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent`;
export const GEMINI_EMBEDDING_DIMENSIONS = 1536;
const MAX_429_RETRIES = 5;
const RETRY_BASE_DELAY_MS = 1000;
const MAX_BACKOFF_DELAY_MS = 30000;

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

  for (let attempt = 0; ; attempt += 1) {
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

    if (response.status === 429) {
      const payload: unknown = await response.json().catch(() => null);
      const providerMessage = getProviderErrorMessage(payload);
      if (attempt >= MAX_429_RETRIES) {
        throw new Error(`Gemini embedding provider returned HTTP 429 after ${attempt + 1} attempts${providerMessage ? `: ${providerMessage}` : "."}`);
      }

      const delay = getRetryDelayMs(response.headers.get("retry-after"), getGeminiRetryDelayMs(payload), attempt);
      console.warn(`Gemini embedding provider returned HTTP 429; retry ${attempt + 1}/${MAX_429_RETRIES} in ${delay} ms.`);
      await wait(delay);
      continue;
    }

    if (!response.ok) throw new Error(`Gemini embedding provider returned HTTP ${response.status}.`);

    const payload = await response.json() as { embedding?: { values?: unknown } };
    const values = payload.embedding?.values;
    if (!Array.isArray(values) || values.length !== GEMINI_EMBEDDING_DIMENSIONS
      || !values.every((value) => typeof value === "number" && Number.isFinite(value))) {
      throw new Error("Gemini embedding provider returned an invalid vector.");
    }

    return values as number[];
  }
}

function getRetryDelayMs(retryAfter: string | null, providerDelayMs: number | null, attempt: number): number {
  const exponentialDelay = Math.min(MAX_BACKOFF_DELAY_MS, RETRY_BASE_DELAY_MS * (2 ** attempt));
  const retryAfterMs = parseRetryAfter(retryAfter);
  const serverDelay = Math.max(providerDelayMs ?? 0, retryAfterMs ?? 0);
  const jitter = Math.floor(Math.random() * Math.min(1000, Math.max(100, exponentialDelay * 0.2)));
  return Math.max(exponentialDelay, serverDelay) + jitter;
}

function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;

  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now());
}

function getGeminiRetryDelayMs(payload: unknown): number | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const error = (payload as { error?: unknown }).error;
  if (!error || typeof error !== "object" || Array.isArray(error)) return null;

  const details = (error as { details?: unknown }).details;
  if (!Array.isArray(details)) return null;
  for (const detail of details) {
    if (!detail || typeof detail !== "object" || Array.isArray(detail)) continue;
    const retryDelay = (detail as { retryDelay?: unknown }).retryDelay;
    if (typeof retryDelay === "string") {
      const match = /^(\d+(?:\.\d+)?)s$/u.exec(retryDelay);
      if (match) return Number(match[1]) * 1000;
    }
  }
  return null;
}

function getProviderErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const error = (payload as { error?: unknown }).error;
  if (!error || typeof error !== "object" || Array.isArray(error)) return null;
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" && message.trim() ? message.trim() : null;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
