import assert from "node:assert/strict";
import test from "node:test";
import { getSafeImageSource, isImageOptimizable } from "@/lib/media-images";

test("image sources allow local paths and HTTPS with recorded attribution", () => {
  assert.equal(getSafeImageSource(" https://images.unsplash.com/photo.jpg ", true), "https://images.unsplash.com/photo.jpg");
  assert.equal(getSafeImageSource("https://upload.wikimedia.org/photo.jpg", true), "https://upload.wikimedia.org/photo.jpg");
  assert.equal(getSafeImageSource("/images/archive-media-fallback.svg"), "/images/archive-media-fallback.svg");
  assert.equal(getSafeImageSource(""), null);
  assert.equal(getSafeImageSource("https://images.example.test/unverified.jpg"), null);
  assert.equal(getSafeImageSource("https://user:pass@images.unsplash.com/photo.jpg", true), null);
  assert.equal(getSafeImageSource("//images.example.test/photo.jpg"), null);
  assert.equal(getSafeImageSource("http://images.example.test/photo.jpg"), null);
  assert.equal(getSafeImageSource("javascript:alert(1)"), null);
  assert.equal(getSafeImageSource("data:image/svg+xml,unsafe"), null);
});

test("image optimization follows the existing local and Unsplash allowlist", () => {
  assert.equal(isImageOptimizable("/images/archive-media-fallback.svg"), true);
  assert.equal(isImageOptimizable("https://images.unsplash.com/photo-123?auto=format"), true);
  assert.equal(isImageOptimizable("https://commons.wikimedia.org/photo.jpg"), false);
  assert.equal(isImageOptimizable("https://images.unsplash.com:8443/photo.jpg"), false);
});