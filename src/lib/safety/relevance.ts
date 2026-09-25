import type { SafetyEventDraft } from "@/lib/safety/types";

const CHITRAL_EXPLICIT_PATTERNS = [
  /\bUpper\s+Chitral\b/i,
  /\bLower\s+Chitral\b/i,
  /\bChitral\b/i,
  /\bDrosh\b/i,
  /\bMastuj\b/i,
  /\bGaram\s+Chashma\b/i,
  /\bBumburet\b/i,
  /\bTorkhow\b/i,
  /\bAyun\b/i,
  /\bKhot\b/i,
  /\bReshun\b/i,
  /\bChitral\s+Town\b/i,
  /\bChitral\s+District\b/i,
  /\bChitral\s+Valley\b/i,
];

export type ChitralRelevanceExample = {
  label: string;
  value: Pick<SafetyEventDraft, "title" | "description" | "location_name">;
  expected: boolean;
};

export const chitralRelevanceExamples: ChitralRelevanceExample[] = [
  {
    label: "included-upper-chitral",
    value: {
      title: "Flood warning for Upper Chitral",
      description: "Flash flood advisory issued for Upper Chitral valley after heavy rain.",
      location_name: "Upper Chitral",
    },
    expected: true,
  },
  {
    label: "included-locality",
    value: {
      title: "Road closure in Drosh",
      description: "Traffic advisory for Drosh and surrounding roads after landslide activity.",
      location_name: "Drosh",
    },
    expected: true,
  },
  {
    label: "excluded-kp-only",
    value: {
      title: "Heavy rain warning for Khyber Pakhtunkhwa",
      description: "Local weather warning for Khyber Pakhtunkhwa without specific Chitral mention.",
      location_name: "Khyber Pakhtunkhwa",
    },
    expected: false,
  },
  {
    label: "excluded-general-pakistan-weather",
    value: {
      title: "Monsoon advisory for Pakistan",
      description: "National monsoon bulletin covering general weather conditions across Pakistan.",
      location_name: "Pakistan",
    },
    expected: false,
  },
  {
    label: "excluded-ambiguous",
    value: {
      title: "Weather alert in the north",
      description: "Risk advisory for mountain communities in northern Pakistan.",
      location_name: "Northern Pakistan",
    },
    expected: false,
  },
];

export function isChitralRelevantSafetyText(value: string | null | undefined): boolean {
  if (!value) return false;

  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return false;

  const explicitMatch = CHITRAL_EXPLICIT_PATTERNS.some((pattern) => pattern.test(normalized));
  if (!explicitMatch) return false;

  const provinceOnlyMatch = /Khyber Pakhtunkhwa|KP|Northwest Pakistan|NWFP/i.test(normalized);
  if (provinceOnlyMatch && !/Chitral|Upper Chitral|Lower Chitral|Drosh|Mastuj|Garam Chashma|Bumburet|Torkhow|Ayun|Khot|Reshun/i.test(normalized)) {
    return false;
  }

  return true;
}

export function isChitralRelevantSafetyRecord(
  record: Pick<SafetyEventDraft, "title" | "description" | "location_name">,
): boolean {
  const combined = [record.title, record.description, record.location_name]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ");

  return isChitralRelevantSafetyText(combined);
}

export function extractChitralRelevantSafetyText(values: Array<string | null | undefined>): string {
  const chunks = values
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .flatMap((value) => value.split(/(?<=[.!?])\s+|\n+|•/))
    .map((value) => value.replace(/\s+/g, " ").trim())
    .filter((value) => value.length > 0)
    .filter((value) => isChitralRelevantSafetyText(value));

  return Array.from(new Set(chunks)).join(" ");
}
