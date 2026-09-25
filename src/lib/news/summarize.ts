import "server-only";

export {
  isNewsSummarizationConfigured,
  summarizeNews,
} from "@/lib/news/summarize-core";
export type {
  NewsSummarizationInput,
  NewsSummarizationResult,
} from "@/lib/news/summarize-core";
