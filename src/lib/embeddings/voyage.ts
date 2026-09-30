import "server-only";

export const VOYAGE_EMBEDDING_MODEL = "voyage-3.5-lite";
export const VOYAGE_EMBEDDING_DIMENSIONS = 1024;

const VOYAGE_EMBEDDING_URL =
  "https://api.voyageai.com/v1/embeddings";

const MAX_BATCH_INPUTS = 128;
const MAX_BATCH_UTF8_BYTES = 9000;
const REQUEST_TIMEOUT_MS = 30000;

type InputType = "document" | "query";

export async function embedVoyageDocuments(
  texts: string[],
): Promise<number[][]> {
  if (texts.length === 0) return [];

  if (
    texts.some(
      (text) =>
        typeof text !== "string" || !text.trim(),
    )
  ) {
    throw new Error(
      "Voyage document inputs must be non-empty strings.",
    );
  }

  const embeddings: number[][] = [];

  for (const batch of createBatches(texts)) {
    const batchEmbeddings = await requestEmbeddings(
      batch,
      "document",
    );

    embeddings.push(...batchEmbeddings);
  }

  return embeddings;
}

export async function embedVoyageQuery(
  text: string,
): Promise<number[]> {
  const normalizedText = text.trim();

  if (!normalizedText) {
    throw new Error("Voyage query must not be empty.");
  }

  const [embedding] = await requestEmbeddings(
    [normalizedText],
    "query",
  );

  return embedding;
}

function createBatches(
  texts: string[],
): string[][] {
  const batches: string[][] = [];

  let batch: string[] = [];
  let batchBytes = 0;

  for (const text of texts) {
    const textBytes = getUtf8Bytes(text);

    if (textBytes > MAX_BATCH_UTF8_BYTES) {
      throw new Error(
        `A Voyage document input exceeds the ${MAX_BATCH_UTF8_BYTES}-byte batch limit.`,
      );
    }

    if (
      batch.length > 0 &&
      (
        batch.length >= MAX_BATCH_INPUTS ||
        batchBytes + textBytes > MAX_BATCH_UTF8_BYTES
      )
    ) {
      batches.push(batch);
      batch = [];
      batchBytes = 0;
    }

    batch.push(text);
    batchBytes += textBytes;
  }

  if (batch.length > 0) {
    batches.push(batch);
  }

  return batches;
}

async function requestEmbeddings(
  texts: string[],
  inputType: InputType,
): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Voyage embedding is not configured; set VOYAGE_API_KEY.",
    );
  }

  let response: Response;

  try {
    response = await fetch(
      VOYAGE_EMBEDDING_URL,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: VOYAGE_EMBEDDING_MODEL,
          input: texts,
          input_type: inputType,
          output_dtype: "float",
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );
  } catch (error) {
    const cause =
      error instanceof Error && error.cause
        ? ` cause=${formatError(error.cause)}`
        : "";

    throw new Error(
      `Voyage network request failed: ${
        error instanceof Error
          ? error.message
          : String(error)
      }${cause}`,
    );
  }

  const rawResponse = await response.text();

  let payload: unknown = null;

  if (rawResponse.trim()) {
    try {
      payload = JSON.parse(rawResponse);
    } catch {
      payload = rawResponse;
    }
  }

  if (!response.ok) {
    const providerMessage =
      getProviderErrorMessage(payload);

    throw new Error(
      `Voyage API HTTP ${response.status}${
        providerMessage
          ? `: ${providerMessage}`
          : `: ${getProviderResponseSummary(payload)}`
      }`,
    );
  }

  return validateEmbeddings(
    payload,
    texts.length,
  );
}

function validateEmbeddings(
  payload: unknown,
  expectedCount: number,
): number[][] {
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    throw new Error(
      `Voyage returned an unexpected response: ${getProviderResponseSummary(payload)}`,
    );
  }

  const data = (
    payload as {
      data?: unknown;
    }
  ).data;

  if (!Array.isArray(data)) {
    throw new Error(
      `Voyage response has no data array: ${getProviderResponseSummary(payload)}`,
    );
  }

  if (data.length !== expectedCount) {
    throw new Error(
      `Voyage returned ${data.length} embeddings; expected ${expectedCount}.`,
    );
  }

  const embeddings: Array<
    number[] | undefined
  > = Array(expectedCount);

  for (
    let responseIndex = 0;
    responseIndex < data.length;
    responseIndex++
  ) {
    const item = data[responseIndex];

    if (
      !item ||
      typeof item !== "object" ||
      Array.isArray(item)
    ) {
      throw new Error(
        `Voyage returned invalid item at response index ${responseIndex}.`,
      );
    }

    const result = item as {
      embedding?: unknown;
      index?: unknown;
    };

    if (
      !Number.isInteger(result.index) ||
      (result.index as number) < 0 ||
      (result.index as number) >= expectedCount
    ) {
      throw new Error(
        `Voyage returned invalid index ${String(
          result.index,
        )} at response index ${responseIndex}.`,
      );
    }

    const index = result.index as number;

    if (embeddings[index]) {
      throw new Error(
        `Voyage returned duplicate index ${index}.`,
      );
    }

    if (!Array.isArray(result.embedding)) {
      throw new Error(
        `Voyage returned no embedding array for index ${index}.`,
      );
    }

    if (
      result.embedding.length !==
      VOYAGE_EMBEDDING_DIMENSIONS
    ) {
      throw new Error(
        `Voyage returned ${result.embedding.length} dimensions for index ${index}; expected ${VOYAGE_EMBEDDING_DIMENSIONS}.`,
      );
    }

    for (
      let dimension = 0;
      dimension < result.embedding.length;
      dimension++
    ) {
      const value = result.embedding[dimension];

      if (
        typeof value !== "number" ||
        !Number.isFinite(value)
      ) {
        throw new Error(
          `Voyage returned an invalid value at index ${index}, dimension ${dimension}.`,
        );
      }
    }

    embeddings[index] =
      result.embedding as number[];
  }

  const missingIndex =
    embeddings.findIndex(
      (embedding) => !embedding,
    );

  if (missingIndex !== -1) {
    throw new Error(
      `Voyage did not return an embedding for index ${missingIndex}.`,
    );
  }

  return embeddings as number[][];
}

function getProviderErrorMessage(
  payload: unknown,
): string | null {
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    return null;
  }

  const value = payload as {
    detail?: unknown;
    message?: unknown;
    error?: unknown;
  };

  if (
    typeof value.detail === "string" &&
    value.detail.trim()
  ) {
    return value.detail.trim();
  }

  if (
    typeof value.message === "string" &&
    value.message.trim()
  ) {
    return value.message.trim();
  }

  if (
    typeof value.error === "string" &&
    value.error.trim()
  ) {
    return value.error.trim();
  }

  if (
    value.error &&
    typeof value.error === "object" &&
    !Array.isArray(value.error)
  ) {
    const message = (
      value.error as {
        message?: unknown;
      }
    ).message;

    if (
      typeof message === "string" &&
      message.trim()
    ) {
      return message.trim();
    }
  }

  return null;
}

function getProviderResponseSummary(
  payload: unknown,
): string {
  if (
    payload === null ||
    payload === undefined
  ) {
    return "empty response body";
  }

  if (typeof payload === "string") {
    return payload.slice(0, 1000);
  }

  if (typeof payload !== "object") {
    return String(payload).slice(0, 1000);
  }

  try {
    return JSON.stringify(payload).slice(
      0,
      2000,
    );
  } catch {
    return "unable to serialize provider response";
  }
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return String(error);
}

function getUtf8Bytes(text: string): number {
  return new TextEncoder()
    .encode(text)
    .byteLength;
}