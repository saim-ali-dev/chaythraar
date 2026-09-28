export const KHOWAR_GLOSSARY_SOURCE = {
  author: "Elena Bashir",
  title: "A Khowar-English glossary [HL Archive 12]",
  publicationYear: 2023,
  sourceUrl: "https://escholarship.org/uc/item/955239w9",
  doi: "10.5070/h90057297",
  license: "CC BY-NC-ND 4.0",
  attribution: "Elena Bashir, A Khowar-English glossary [HL Archive 12], 2023",
  projectPermission: "Project-specific permission granted to CHAYTHRAAR for noncommercial school/hackathon cultural-preservation use.",
} as const;

export type KhowarGlossaryExample = {
  khowar: string;
  englishTranslation?: string | null;
  sourceLocator?: string | null;
  provenance?: Record<string, unknown>;
};

export type KhowarGlossaryRecord = {
  id: string;
  sourceEntryId: string;
  headword: string;
  englishGloss: string | null;
  englishDefinition: string | null;
  culturalNotes: string | null;
  examples: KhowarGlossaryExample[];
  sourceAuthor: string;
  sourceTitle: string;
  publicationYear: number;
  sourceUrl: string;
  sourceDoi: string;
  sourceLocator: string | null;
  license: string;
  attribution: string;
  projectPermission: string;
  provenance: Record<string, unknown>;
  createdAt: string;
};
