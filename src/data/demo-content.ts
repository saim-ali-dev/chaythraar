import type {
  EncyclopediaTopic,
  NewsItem,
  SafetyItem,
  SuggestedPrompt,
  TouristPlace,
} from "@/types/content";

// This is intentionally local demo content. It will be replaced by verified sources later.
export const encyclopediaTopics: EncyclopediaTopic[] = [
  {
    id: "land-and-language",
    title: "Land & language",
    summary: "A starting point for exploring Chitral's geography, communities, and living languages.",
    category: "Foundations",
    status: "demo",
  },
  {
    id: "heritage-and-craft",
    title: "Heritage & craft",
    summary: "Discover the stories, practices, and creative traditions that shape the region.",
    category: "Culture",
    status: "demo",
  },
  {
    id: "mountain-life",
    title: "Mountain life",
    summary: "An orientation to seasonal rhythms, valleys, and everyday knowledge.",
    category: "People & place",
    status: "demo",
  },
];

export const touristPlaces: TouristPlace[] = [
  {
    id: "upper-valleys",
    name: "Upper valleys",
    region: "Chitral region",
    description: "A discovery guide for planning a thoughtful journey through highland landscapes.",
    tag: "Plan a route",
    status: "demo",
  },
  {
    id: "heritage-stops",
    name: "Heritage stops",
    region: "Across Chitral",
    description: "A curated starting point for places where local history and daily life meet.",
    tag: "Explore stories",
    status: "demo",
  },
  {
    id: "river-corridors",
    name: "River corridors",
    region: "Chitral region",
    description: "Use the future map experience to connect landscapes, settlements, and viewpoints.",
    tag: "Open the map",
    status: "demo",
  },
];

export const newsItems: NewsItem[] = [
  {
    id: "community-brief",
    title: "Community brief: a calmer way to follow local updates",
    source: "CHAYTHRAAR demo desk",
    dateLabel: "Demo update",
    category: "Local life",
    status: "demo",
  },
  {
    id: "seasonal-planning",
    title: "Seasonal planning notes for visitors and residents",
    source: "CHAYTHRAAR demo desk",
    dateLabel: "Demo update",
    category: "Planning",
    status: "demo",
  },
];

export const safetyItems: SafetyItem[] = [
  {
    id: "verify-before-travel",
    title: "Verify conditions before travel",
    detail: "Use official local updates for current road, weather, and access information.",
    level: "Prepare",
    status: "demo",
  },
  {
    id: "keep-local-context",
    title: "Keep local context close",
    detail: "A future safety view will bring trusted notices and practical contacts together.",
    level: "Monitor",
    status: "demo",
  },
];

export const suggestedPrompts: SuggestedPrompt[] = [
  {
    id: "start-here",
    label: "Start here",
    prompt: "What should I know before exploring Chitral?",
  },
  {
    id: "language",
    label: "Language",
    prompt: "Teach me a useful phrase in Khowar.",
  },
  {
    id: "plan-day",
    label: "Plan a day",
    prompt: "Help me sketch a thoughtful day of discovery.",
  },
  {
    id: "stay-informed",
    label: "Stay informed",
    prompt: "What kinds of local updates should I check?",
  },
];
