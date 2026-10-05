import assert from "node:assert/strict";
import test from "node:test";
import { buildChitralAoi, getLatestSentinel2Scene, normalizeODataProducts } from "@/lib/satellite/sentinel2";

const VALID_AOI_FEATURES = [
  [50701, "CHITRAL LOWER", "CHITRAL"],
  [50702, "CHITRAL LOWER", "DROSH"],
  [50703, "CHITRAL LOWER", "LOTKOH"],
  [50801, "CHITRAL UPPER", "MASTUJ"],
  [50802, "CHITRAL UPPER", "MULKHOW"],
].map(([code, district, tehsil]) => ({
  properties: { province: "KHYBER PAKHTUNKHWA", districts: district, tehsils: tehsil, teh_code: code, last_edited_date: 1673203295820 },
  geometry: { type: "Polygon", coordinates: [[[70, 36], [71, 36], [71, 37], [70, 36]]] },
}));

test("builds a Chitral-only MultiPolygon from the verified district tehsils", () => {
  const aoi = buildChitralAoi({ features: VALID_AOI_FEATURES });

  assert.equal(aoi.type, "MultiPolygon");
  assert.equal(aoi.coordinates.length, 5);
});

test("rejects boundary results whose Chitral district provenance changed", () => {
  const changedDistrict = structuredClone(VALID_AOI_FEATURES);
  changedDistrict[0]!.properties.districts = "DIR UPPER";

  assert.throws(() => buildChitralAoi({ features: changedDistrict }), /no longer match/);
  assert.throws(() => buildChitralAoi({ features: VALID_AOI_FEATURES.slice(1) }), /feature count/);
});

test("normalizes OData product name, acquisition date, and scene cloud cover", () => {
  const scenes = normalizeODataProducts({
    value: [
      { Id: "uuid-newer", Name: "S2A_NEWER.SAFE", ContentDate: { Start: "2026-09-30T09:00:00Z" }, Attributes: [{ Name: "cloudCover", Value: 18 }] },
      { Id: "uuid-older", Name: "S2A_OLDER.SAFE", ContentDate: { Start: "2026-09-28T09:00:00Z" }, Attributes: [{ Name: "cloudCover", Value: 110 }] },
    ],
  });

  assert.equal(scenes[0]?.id, "S2A_NEWER.SAFE");
  assert.equal(scenes[0]?.acquisitionDate, "2026-09-30T09:00:00Z");
  assert.equal(scenes[0]?.sceneCloudCover, 18);
  assert.equal(scenes[0]?.viewerUrl, "https://dataspace.copernicus.eu/browser/");
  assert.equal(scenes[1]?.sceneCloudCover, null);
});

test("queries OData within each verified Chitral polygon with date and L2A filters", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.includes("FeatureServer")) return Response.json({ features: VALID_AOI_FEATURES });
    return Response.json({ value: [{ Id: "uuid-scene", Name: "S2-scene.SAFE", ContentDate: { Start: "2026-09-30T09:00:00Z" }, Attributes: [{ Name: "cloudCover", Value: 18 }] }] });
  };

  const result = await getLatestSentinel2Scene(fetcher, new Date("2026-10-01T00:00:00Z"));
  const odataCalls = calls.slice(1).map(({ url, init }) => ({ url: new URL(url), init }));

  assert.equal(calls.length, 6);
  assert.ok(odataCalls.every(({ url, init }) => url.origin === "https://catalogue.dataspace.copernicus.eu" && url.pathname === "/odata/v1/Products" && !init?.method));
  assert.equal(odataCalls.length, 5);
  for (const { url } of odataCalls) {
    const filter = url.searchParams.get("$filter") ?? "";
    assert.match(filter, /Collection\/Name eq 'SENTINEL-2'/);
    assert.match(filter, /productType.*S2MSI2A/);
    assert.match(filter, /OData\.CSC\.Intersects\(area=geography'SRID=4326;POLYGON/);
    assert.match(filter, /ContentDate\/Start ge 2026-08-17T00:00:00\.000Z/);
    assert.match(filter, /ContentDate\/Start le 2026-10-01T00:00:00\.000Z/);
    assert.equal(url.searchParams.get("$orderby"), "ContentDate/Start desc");
    assert.equal(url.searchParams.get("$top"), "5");
    assert.equal(url.searchParams.get("$expand"), "Attributes");
  }
  assert.equal(result.scene?.id, "S2-scene.SAFE");
  assert.equal(result.scene?.sceneCloudCover, 18);
});

test("does not call AMS when all primary OData requests succeed", async () => {
  const hosts: string[] = [];
  const fetcher: typeof fetch = async (input) => {
    const url = String(input);
    if (url.includes("FeatureServer")) return Response.json({ features: VALID_AOI_FEATURES });
    hosts.push(new URL(url).host);
    return Response.json({ value: [{ Id: "uuid-primary", Name: "S2-PRIMARY.SAFE", ContentDate: { Start: "2026-09-30T09:00:00Z" }, Attributes: [{ Name: "cloudCover", Value: 12 }] }] });
  };

  const result = await getLatestSentinel2Scene(fetcher, new Date("2026-10-01T00:00:00Z"));

  assert.equal(result.error, null);
  assert.equal(result.scene?.id, "S2-PRIMARY.SAFE");
  assert.equal(hosts.length, 5);
  assert.ok(hosts.every((host) => host === "catalogue.dataspace.copernicus.eu"));
});

test("retries the exact OData query on AMS after primary request failures", async () => {
  const hosts: string[] = [];
  const primaryQueries = new Set<string>();
  const fallbackQueries = new Set<string>();
  const fetcher: typeof fetch = async (input) => {
    const url = String(input);
    if (url.includes("FeatureServer")) return Response.json({ features: VALID_AOI_FEATURES });
    const parsedUrl = new URL(url);
    hosts.push(parsedUrl.host);
    const query = parsedUrl.search;
    if (parsedUrl.host === "catalogue.dataspace.copernicus.eu") {
      primaryQueries.add(query);
      return new Response("temporarily unavailable", { status: 503 });
    }
    fallbackQueries.add(query);
    return Response.json({ value: [{ Id: "uuid-scene", Name: "S2-AMS.SAFE", ContentDate: { Start: "2026-09-30T09:00:00Z" }, Attributes: [{ Name: "cloudCover", Value: 18 }] }] });
  };

  const result = await getLatestSentinel2Scene(fetcher, new Date("2026-10-01T00:00:00Z"));

  assert.equal(hosts.length, 10);
  assert.equal(hosts.filter((host) => host === "catalogue.dataspace.copernicus.eu").length, 5);
  assert.equal(hosts.filter((host) => host === "catalogue.ams.dataspace.copernicus.eu").length, 5);
  assert.deepEqual([...fallbackQueries].sort(), [...primaryQueries].sort());
  assert.equal(result.scene?.id, "S2-AMS.SAFE");
  assert.equal(result.scene?.sceneCloudCover, 18);
  assert.equal(result.error, null);
});

test("does not call AMS when the primary returns a valid empty result", async () => {
  const hosts: string[] = [];
  const fetcher: typeof fetch = async (input) => {
    const url = String(input);
    if (url.includes("FeatureServer")) return Response.json({ features: VALID_AOI_FEATURES });
    hosts.push(new URL(url).host);
    return Response.json({ value: [] });
  };

  const result = await getLatestSentinel2Scene(fetcher, new Date("2026-10-01T00:00:00Z"));

  assert.equal(result.scene, null);
  assert.equal(result.error, null);
  assert.equal(hosts.length, 5);
  assert.ok(hosts.every((host) => host === "catalogue.dataspace.copernicus.eu"));
});

test("returns no scene for empty search and graceful unavailable state for API failure", async () => {
  assert.deepEqual(normalizeODataProducts({ value: [] }), []);

  let callCount = 0;
  const fetcher: typeof fetch = async () => {
    callCount += 1;
    if (callCount === 1) return Response.json({ features: VALID_AOI_FEATURES });
    return new Response("unavailable", { status: 503 });
  };
  const result = await getLatestSentinel2Scene(fetcher, new Date("2026-10-01T00:00:00Z"));
  assert.equal(result.scene, null);
  assert.equal(result.error, "Latest Sentinel-2 imagery is temporarily unavailable.");
});

test("keeps the unavailable result when both OData catalogues fail", async () => {
  const hosts: string[] = [];
  const fetcher: typeof fetch = async (input) => {
    const url = String(input);
    if (url.includes("FeatureServer")) return Response.json({ features: VALID_AOI_FEATURES });
    hosts.push(new URL(url).host);
    return new Response("catalogue unavailable", { status: 503 });
  };

  const result = await getLatestSentinel2Scene(fetcher, new Date("2026-10-01T00:00:00Z"));

  assert.equal(result.scene, null);
  assert.equal(result.error, "Latest Sentinel-2 imagery is temporarily unavailable.");
  assert.equal(hosts.length, 10);
  assert.equal(hosts.filter((host) => host === "catalogue.dataspace.copernicus.eu").length, 5);
  assert.equal(hosts.filter((host) => host === "catalogue.ams.dataspace.copernicus.eu").length, 5);
});