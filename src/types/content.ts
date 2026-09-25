export type ContentStatus = "demo" | "live";

export type EncyclopediaEntry = {
  id: string;
  title: string;
  category: string;
  content: string;
  image_url: string | null;
  source: string | null;
  source_url: string | null;
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
