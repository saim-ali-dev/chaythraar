export function normalizeContentCategory(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function isMusicCategory(value: string | null | undefined): boolean {
  const category = normalizeContentCategory(value);

  return [
    "music",
    "musical instrument",
    "musical instruments",
    "instrument",
    "instruments",
    "folk music",
    "traditional music",
  ].includes(category);
}

export function isFoodCategory(value: string | null | undefined): boolean {
  const category = normalizeContentCategory(value);

  return ["food", "traditional food", "cuisine", "food culture"].includes(category);
}
