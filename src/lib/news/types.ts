export type NormalizedNewsItem = {
  title: string;
  summary: string | null;
  source: string;
  source_url: string;
  image_url: string | null;
  published_at: string;
  category: string;
};

export type NewsIngestionReport = {
  discovered: number;
  normalized: number;
  inserted: number;
  skipped: number;
  duplicates: number;
  errors: string[];
};
