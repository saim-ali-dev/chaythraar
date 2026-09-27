import { AssistantServiceError, answerAssistantMessage, logAssistantRuntimeError } from "@/lib/assistant/service";

const MAX_REQUEST_BYTES = 8192;
const MAX_MESSAGE_CHARACTERS = 1200;

export async function POST(request: Request): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return Response.json({ error: "Content-Type must be application/json." }, { status: 415 });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_REQUEST_BYTES) {
    return Response.json({ error: "Request body is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
      return Response.json({ error: "Request body is too large." }, { status: 413 });
    }
    body = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isMessageRequest(body)) {
    return Response.json({ error: "Provide only a message field containing a string." }, { status: 400 });
  }

  const message = body.message.trim();
  if (!message || message.length > MAX_MESSAGE_CHARACTERS) {
    return Response.json({ error: `Message must contain 1 to ${MAX_MESSAGE_CHARACTERS} characters.` }, { status: 400 });
  }

  try {
    const result = await answerAssistantMessage(message);
    return Response.json(result);
  } catch (error) {
    if (error instanceof AssistantServiceError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    logAssistantRuntimeError(error);
    return Response.json({ error: "The assistant could not complete the request." }, { status: 500 });
  }
}

function isMessageRequest(value: unknown): value is { message: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const body = value as Record<string, unknown>;
  return Object.keys(body).length === 1 && typeof body.message === "string";
}
