import "server-only";

export {
  completeAssistantJson,
  isNewsSummarizationConfigured,
  summarizeNews,
} from "@/lib/news/summarize-core";
export type {
  AssistantCompletionInput,
  NewsSummarizationInput,
  NewsSummarizationResult,
} from "@/lib/news/summarize-core";
