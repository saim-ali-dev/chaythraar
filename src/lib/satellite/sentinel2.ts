import "server-only";
import aoiSource from "@/data/chitral-aoi-source.json";

const ARCGIS_LAYER_URL = aoiSource.sourceUrl;
const ODATA_PRODUCTS_URL = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products";
const ODATA_FALLBACK_PRODUCTS_URL = "https://catalogue.ams.dataspace.copernicus.eu/odata/v1/Products";
const COPERNICUS_BROWSER_URL = "https://dataspace.copernicus.eu/browser/";
const LOOKBACK_DAYS = 45;
const RESULT_LIMIT = 5;

type Position = number[];
type PolygonCoordinates = Position[][];
type MultiPolygonGeometry = { type: "MultiPolygon"; coordinates: PolygonCoordinates[] };

export type Sentinel2Scene = {
  id: string;
  acquisitionDate: string;
  sceneCloudCover: number | null;
  viewerUrl: string;
};

export type Sentinel2Result = {
  scene: Sentinel2Scene | null;
  error: string | null;
};

type ArcGisFeature = {
  properties?: Record<string, unknown>;
  geometry?: { type?: unknown; coordinates?: unknown };
};

export async function getLatestSentinel2Scene(fetcher: typeof fetch = fetch, now = new Date()): Promise<Sentinel2Result> {
  try {
    const geometry = await fetchChitralGeometry(fetcher);
    const end = now.toISOString();
    const start = new Date(now.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const products = await Promise.all(geometry.coordinates.map((polygon) => fetchPolygonProducts(polygon, start, end, fetcher)));
    const scenes = new Map<string, Sentinel2Scene>();
    products.flat().forEach((scene) => scenes.set(scene.id, scene));
    const latest = [...scenes.values()].sort((left, right) => Date.parse(right.acquisitionDate) - Date.parse(left.acquisitionDate))[0] ?? null;
    return { scene: latest, error: null };
  } catch (error) {
    console.error("Unable to load Chitral Sentinel-2 imagery.", error);
    return { scene: null, error: "Latest Sentinel-2 imagery is temporarily unavailable." };
  }
}

export function buildChitralAoi(value: unknown): MultiPolygonGeometry {
  if (!isRecord(value) || !Array.isArray(value.features)) throw new Error("The Chitral boundary response is malformed.");

  const expected = Object.entries(aoiSource.districts).flatMap(([district, details]) => details.tehsilCodes.map((code, index) => ({
    code,
    district,
    tehsil: details.tehsilNames[index],
  })));
  if (value.features.length !== expected.length) throw new Error("The Chitral boundary feature count has changed.");

  const features = value.features as ArcGisFeature[];
  const byCode = new Map<number, ArcGisFeature>();
  for (const feature of features) {
    const properties = feature.properties;
    if (!properties || typeof properties.teh_code !== "number" || byCode.has(properties.teh_code)) {
      throw new Error("The Chitral boundary contains an invalid tehsil code.");
    }
    byCode.set(properties.teh_code, feature);
  }

  const polygons = expected.map(({ code, district, tehsil }) => {
    const feature = byCode.get(code);
    const properties = feature?.properties;
    const geometry = feature?.geometry;
    if (
      properties?.province !== aoiSource.province
      || properties.districts !== district
      || properties.tehsils !== tehsil
      || properties.last_edited_date !== aoiSource.featureLastEditedEpoch
      || geometry?.type !== "Polygon"
      || !isPolygonCoordinates(geometry.coordinates)
    ) {
      throw new Error("The Chitral boundary attributes or geometry no longer match the verified source.");
    }
    return geometry.coordinates;
  });

  return { type: "MultiPolygon", coordinates: polygons };
}

export function normalizeODataProducts(value: unknown): Sentinel2Scene[] {
  if (!isRecord(value) || !Array.isArray(value.value)) throw new Error("The Copernicus OData response is malformed.");

  return value.value.flatMap((product): Sentinel2Scene[] => {
    if (!isRecord(product) || !isRecord(product.ContentDate)) return [];
    const productId = typeof product.Name === "string" ? product.Name : product.Id;
    const acquisitionDate = product.ContentDate.Start;
    if (typeof productId !== "string" || typeof acquisitionDate !== "string" || !Number.isFinite(Date.parse(acquisitionDate))) return [];
    const cloudCover = readCloudCover(product.Attributes);
    return [{ id: productId, acquisitionDate, sceneCloudCover: cloudCover, viewerUrl: COPERNICUS_BROWSER_URL }];
  });
}

async function fetchPolygonProducts(polygon: PolygonCoordinates, start: string, end: string, fetcher: typeof fetch): Promise<Sentinel2Scene[]> {
  const polygonWkt = `POLYGON(${polygon.map((ring) => `(${ring.map(([longitude, latitude]) => `${longitude} ${latitude}`).join(",")})`).join(",")})`;
  const filter = [
    "Collection/Name eq 'SENTINEL-2'",
    "Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'productType' and att/OData.CSC.StringAttribute/Value eq 'S2MSI2A')",
    `OData.CSC.Intersects(area=geography'SRID=4326;${polygonWkt}')`,
    `ContentDate/Start ge ${start}`,
    `ContentDate/Start le ${end}`,
  ].join(" and ");
  const query = new URLSearchParams({
    "$filter": filter,
    "$orderby": "ContentDate/Start desc",
    "$top": String(RESULT_LIMIT),
    "$expand": "Attributes",
  });

  try {
    return await requestODataProducts(ODATA_PRODUCTS_URL, query, fetcher);
  } catch {
    return requestODataProducts(ODATA_FALLBACK_PRODUCTS_URL, query, fetcher);
  }
}

async function requestODataProducts(endpoint: string, query: URLSearchParams, fetcher: typeof fetch): Promise<Sentinel2Scene[]> {
  const url = new URL(endpoint);
  url.search = query.toString();
  const response = await fetcher(url, {
    headers: { accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`Copernicus OData returned HTTP ${response.status}.`);
  return normalizeODataProducts(await response.json() as unknown);
}

function readCloudCover(attributes: unknown): number | null {
  if (!Array.isArray(attributes)) return null;
  const value = attributes.find((attribute) => isRecord(attribute) && attribute.Name === "cloudCover")?.Value;
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
}

async function fetchChitralGeometry(fetcher: typeof fetch): Promise<MultiPolygonGeometry> {
  const url = new URL(`${ARCGIS_LAYER_URL}/query`);
  url.search = new URLSearchParams({
    where: `province = '${aoiSource.province}' AND districts IN (${Object.keys(aoiSource.districts).map((district) => `'${district}'`).join(", ")})`,
    outFields: "province,districts,tehsils,teh_code,last_edited_date",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
  }).toString();

  const response = await fetcher(url, { cache: "no-store", signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`Chitral boundary source returned HTTP ${response.status}.`);
  return buildChitralAoi(await response.json() as unknown);
}

function isPolygonCoordinates(value: unknown): value is PolygonCoordinates {
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.every((ring) => Array.isArray(ring) && ring.length >= 4 && ring.every(isPosition));
}

function isPosition(value: unknown): value is Position {
  return Array.isArray(value)
    && value.length >= 2
    && value.every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}