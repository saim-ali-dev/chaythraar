export type ContentStatus = "demo";

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
