export function getSafeImageSource(src: string | null, hasAttributionMetadata = false): string | null {
  const candidate = src?.trim();
  if (!candidate) return null;
  if (candidate.startsWith("/") && !candidate.startsWith("//")) return candidate;

  try {
    const url = new URL(candidate);
    return url.protocol === "https:"
      && !url.username
      && !url.password
      && hasAttributionMetadata
      ? candidate
      : null;
  } catch {
    return null;
  }
}

export function isImageOptimizable(src: string): boolean {
  if (src.startsWith("/")) return true;

  try {
    const url = new URL(src);
    return url.protocol === "https:" && url.hostname === "images.unsplash.com" && !url.port && !url.username && !url.password;
  } catch {
    return false;
  }
}