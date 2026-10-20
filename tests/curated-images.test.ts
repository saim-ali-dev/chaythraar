import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { CURATED_IMAGES, getCuratedArchiveImage, getCuratedPlaceImage } from "@/lib/curated-images";

test("curated image mappings require exact matching record names", () => {
  assert.equal(getCuratedPlaceImage(" Shahi   Fort "), CURATED_IMAGES.shahiFort);
  assert.equal(getCuratedPlaceImage("Qaqlasht Meadows"), CURATED_IMAGES.qaqlashtMeadows);
  assert.equal(getCuratedPlaceImage("Bumburet"), null);
  assert.equal(getCuratedPlaceImage("Kalash Valley"), CURATED_IMAGES.kalashHouse);
  assert.equal(getCuratedPlaceImage("Shahi Fort Hotel"), null);
  assert.equal(getCuratedArchiveImage("Chilam Josh"), CURATED_IMAGES.chilamJosh);
  assert.equal(getCuratedArchiveImage("Chitral Fort"), CURATED_IMAGES.shahiFort);
  assert.equal(getCuratedArchiveImage("Shahi Mosque, Chitral"), CURATED_IMAGES.shahiMosque);
  assert.equal(getCuratedArchiveImage("A typical house in Kalash Valley"), CURATED_IMAGES.kalashHouse);
  assert.equal(getCuratedArchiveImage("Chilam Josh Festival Review"), null);
});

test("every curated asset declares source, creator, license, and modification notes", () => {
  for (const image of Object.values(CURATED_IMAGES)) {
    assert.ok(image.src.startsWith("/images/commons/"));
    assert.ok(image.alt.length > 0);
    assert.ok(image.imageSourceUrl.startsWith("https://commons.wikimedia.org/wiki/File:"));
    assert.ok(image.imageCredit.length > 0);
    assert.equal(image.imageLicense, "CC BY-SA 4.0 (Attribution-ShareAlike)");
    assert.equal(image.imageLicenseUrl, "https://creativecommons.org/licenses/by-sa/4.0/");
    assert.ok(image.imageChanges.includes("converted from JPEG to WebP"));
  }
});

test("every curated local image exists and stays under 1.2 MB", () => {
  for (const image of Object.values(CURATED_IMAGES)) {
    const filePath = resolve(process.cwd(), "public", image.src.slice(1));
    assert.equal(existsSync(filePath), true, `${image.src} should exist`);
    assert.ok(statSync(filePath).size < 1_200_000, `${image.src} should stay optimized`);
  }
});