export type AdminContentEntity = "encyclopedia" | "places" | "translations";
export type AdminContentRecord = Record<string, unknown>;

type FieldRule = {
  type: "text" | "url" | "number" | "time" | "boolean";
  maxLength?: number;
  required?: boolean;
};

const ENTITY_FIELDS: Record<AdminContentEntity, Record<string, FieldRule>> = {
  encyclopedia: {
    title: { type: "text", maxLength: 160, required: true },
    category: { type: "text", maxLength: 80, required: true },
    content: { type: "text", maxLength: 12000, required: true },
    image_url: { type: "url" },
    source: { type: "text", maxLength: 500 },
    source_url: { type: "url" },
    media_url: { type: "url" },
    image_source: { type: "text", maxLength: 500 },
    image_credit: { type: "text", maxLength: 500 },
    image_license: { type: "text", maxLength: 500 },
  },
  places: {
    name: { type: "text", maxLength: 160, required: true },
    category: { type: "text", maxLength: 80, required: true },
    description: { type: "text", maxLength: 12000 },
    latitude: { type: "number" },
    longitude: { type: "number" },
    image_url: { type: "url" },
    opening_time: { type: "time" },
    closing_time: { type: "time" },
    source: { type: "text", maxLength: 500 },
    source_url: { type: "url" },
  },
  translations: {
    khowar: { type: "text", maxLength: 1000, required: true },
    urdu: { type: "text", maxLength: 2000, required: true },
    english: { type: "text", maxLength: 2000, required: true },
    example: { type: "text", maxLength: 4000 },
    verified: { type: "boolean" },
    source: { type: "text", maxLength: 500 },
  },
};

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/u;

export function validateAdminContentRecord(
  entity: AdminContentEntity,
  input: unknown,
  mode: "create" | "update",
): { record: AdminContentRecord | null; errors: string[] } {
  if (!isRecord(input)) return { record: null, errors: ["Record must be an object."] };

  const fields = ENTITY_FIELDS[entity];
  const record: AdminContentRecord = {};
  const errors: string[] = [];
  for (const key of Object.keys(input)) {
    const rule = fields[key];
    if (!rule) {
      errors.push(`Unsupported field: ${key}.`);
      continue;
    }
    const value = input[key];
    if (rule.type === "text") {
      if (value === null && !rule.required) {
        record[key] = null;
      } else if (typeof value !== "string") {
        errors.push(`${key} must be a string${rule.required ? "" : " or null"}.`);
      } else {
        const trimmed = value.trim();
        if ((rule.required && !trimmed) || trimmed.length > (rule.maxLength ?? 12000)) {
          errors.push(`${key} must be ${rule.required ? "non-empty and " : ""}at most ${rule.maxLength ?? 12000} characters.`);
        } else {
          record[key] = trimmed || null;
        }
      }
    } else if (rule.type === "url") {
      if (value === null || value === "") {
        record[key] = null;
      } else if (typeof value !== "string" || !isHttpUrl(value.trim())) {
        errors.push(`${key} must be a valid HTTP(S) URL or null.`);
      } else {
        record[key] = value.trim();
      }
    } else if (rule.type === "number") {
      if (value === null) {
        record[key] = null;
      } else if (typeof value !== "number" || !Number.isFinite(value)
        || (key === "latitude" && (value < -90 || value > 90))
        || (key === "longitude" && (value < -180 || value > 180))) {
        errors.push(`${key} must be a finite coordinate within its valid range or null.`);
      } else {
        record[key] = value;
      }
    } else if (rule.type === "time") {
      if (value === null || value === "") {
        record[key] = null;
      } else if (typeof value !== "string" || !TIME_PATTERN.test(value.trim())) {
        errors.push(`${key} must use 24-hour HH:MM or HH:MM:SS format or null.`);
      } else {
        record[key] = value.trim();
      }
    } else if (typeof value !== "boolean") {
      errors.push(`${key} must be a boolean.`);
    } else {
      record[key] = value;
    }
  }

  if (entity === "places" && (Object.hasOwn(input, "latitude") !== Object.hasOwn(input, "longitude"))) {
    errors.push("latitude and longitude must be supplied together.");
  }
  if (entity === "places" && input.latitude === null !== (input.longitude === null)
    && Object.hasOwn(input, "latitude") && Object.hasOwn(input, "longitude")) {
    errors.push("latitude and longitude must both be null or both be numbers.");
  }

  if (mode === "create") {
    for (const [key, rule] of Object.entries(fields)) {
      if (rule.required && !Object.hasOwn(input, key)) errors.push(`${key} is required.`);
    }
  }
  if (mode === "update" && Object.keys(input).length === 0) errors.push("At least one editable field is required.");

  return errors.length ? { record: null, errors } : { record, errors };
}

export function isAdminContentEntity(value: unknown): value is AdminContentEntity {
  return value === "encyclopedia" || value === "places" || value === "translations";
}

function isHttpUrl(value: string) {
  if (!value || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is AdminContentRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}