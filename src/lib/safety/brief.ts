import type { SafetyEventDraft } from "@/lib/safety/types";
import { summarizeSafety } from "@/lib/news/summarize-core";

type SafetyBrief = {
  headline: string;
  summary: string;
};

export async function buildSafetyBrief(event: SafetyEventDraft): Promise<SafetyBrief> {
  try {
    const generated = await summarizeSafety({
      title: event.title,
      sourceContent: getSourceContent(event),
      sourceName: event.source_name,
      sourceType: event.source_type,
      locationName: event.location_name,
    });
    if (generated) {
      return {
        headline: generated.headline,
        summary: generated.summary_short,
      };
    }
  } catch {
    // The factual fallback below avoids blocking ingestion when the provider fails.
  }

  return buildFactualFallback(event);
}

function getSourceContent(event: SafetyEventDraft): string {
  if (event.relevant_source_content) return event.relevant_source_content.slice(0, 16000);

  const normalizedContent = event.description.trim();
  const rawContent = event.raw_source.trim();
  if (!rawContent || rawContent === normalizedContent) return normalizedContent.slice(0, 12000);
  return `${normalizedContent}\n\nAdditional source content:\n${rawContent}`.slice(0, 16000);
}

function buildFactualFallback(event: SafetyEventDraft): SafetyBrief {
  const eventLabel = humanizeEventType(event.event_type);
  const location = event.location_name?.trim();
  const locationPhrase = location ? ` in ${location}` : "";
  const sourceLabel = event.source_type === "official" ? `Official source ${event.source_name}` : `News source ${event.source_name} (unverified)`;
  const issuedDate = formatBriefDate(event.issued_at ?? event.published_at ?? event.reported_at);
  const dateSentence = issuedDate ? ` The source record was issued on ${issuedDate}.` : "";

  return {
    headline: `${capitalize(eventLabel)} reported${locationPhrase}`,
    summary: `${sourceLabel} reported a ${eventLabel}${locationPhrase}.${dateSentence}`,
  };
}

function humanizeEventType(eventType: string | null): string {
  const normalized = eventType?.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
  return normalized || "safety event";
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatBriefDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}
