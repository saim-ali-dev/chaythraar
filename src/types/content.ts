export type ContentStatus = "demo" | "live";

export type EncyclopediaEntry = {
  id: string;
  title: string;
  category: string;
  content: string;
  image_url: string | null;
  source: string | null;
  source_url: string | null;
  media_url: string | null;
  created_at: string;
};

export type EncyclopediaTopic = {
  id: string;
  title: string;
  summary: string;
  category: string;
  status: ContentStatus;
};

export type TouristPlace = {
  id: string;
  name: string;
  region: string;
  description: string;
  tag: string;
  status: ContentStatus;
};

export type NewsItem = {
  id: string;
  title: string;
  source: string;
  dateLabel: string;
  category: string;
  status: ContentStatus;
};

export type NewsEntry = {
  id: string;
  title: string;
  summary: string | null;
  headline: string | null;
  summary_short: string | null;
  original_title: string | null;
  original_language: string | null;
  source: string;
  source_url: string | null;
  image_url: string | null;
  published_at: string;
  category: string;
  created_at: string;
};

export type SafetyItem = {
  id: string;
  title: string;
  detail: string;
  level: "Monitor" | "Prepare";
  status: ContentStatus;
};

export type SuggestedPrompt = {
  id: string;
  label: string;
  prompt: string;
};
