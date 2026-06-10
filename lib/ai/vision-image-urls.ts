/**
 * URLs OpenAI Vision can consume (public HTTPS or inline data:image).
 * blob: URLs only work in the browser — convert client-side before POST.
 */

export function isVisionImageUrl(url: string): boolean {
  if (typeof url !== "string" || !url.trim()) return false;
  if (url.startsWith("data:image/")) return true;
  if (url.startsWith("https://")) return true;
  if (url.startsWith("http://")) {
    return !/localhost|127\.0\.0\.1/i.test(url);
  }
  return false;
}

export function countVisionImageUrls(urls: string[] | undefined): number {
  return (urls ?? []).filter(isVisionImageUrl).length;
}

/** Prefer uploaded HTTPS URLs; fall back to in-form previews (may be blob:). */
export function mergeProductImageSources(
  storedImages: string[],
  previewImages: string[]
): string[] {
  const remote = (storedImages ?? []).filter(
    (u) => typeof u === "string" && u.trim().length > 0
  );
  const usableRemote = remote.filter(isVisionImageUrl);
  if (usableRemote.length > 0) return usableRemote;

  const previews = (previewImages ?? []).filter(
    (u) => typeof u === "string" && u.trim().length > 0
  );
  if (previews.length > 0) return previews;

  return remote.length > 0 ? remote : [];
}
