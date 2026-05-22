/**
 * Geocode addresses via Nominatim (server-side).
 * Tries several query variants (e.g. strips "Shop 4/735" → "735 Beams Rd").
 */

const NOMINATIM = "https://nominatim.openstreetmap.org/search";

/** Greater Brisbane / SEQ — submissions must land in service area. */
const SEQ_BOUNDS = {
  south: -28.5,
  north: -26.5,
  west: 152,
  east: 154.25,
};

function inSeqBounds(lat, lng) {
  return (
    lat >= SEQ_BOUNDS.south &&
    lat <= SEQ_BOUNDS.north &&
    lng >= SEQ_BOUNDS.west &&
    lng <= SEQ_BOUNDS.east
  );
}

function buildGeocodeQueries(address) {
  const trimmed = String(address ?? "").trim();
  if (!trimmed) return [];

  const queries = [];
  const add = (q) => {
    const t = String(q ?? "").trim();
    if (t.length >= 5 && !queries.includes(t)) queries.push(t);
  };

  const stripAustralia = (s) => s.replace(/,?\s*Australia\s*$/i, "").trim();

  const normalizeUnits = (s) =>
    s
      .replace(/\b(?:shop|unit|suite|level|lot)\s*#?\s*\d+\s*\/\s*/gi, "")
      .replace(/\b\d+\s*\/\s*(\d+)\s+(?=[A-Za-z])/gi, "$1 ");

  add(trimmed);
  add(stripAustralia(trimmed));
  add(normalizeUnits(trimmed));
  add(stripAustralia(normalizeUnits(trimmed)));

  const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);

  const streetPart = parts.find(
    (p) =>
      /\d/.test(p) &&
      /\b(rd|road|st|street|ave|avenue|drive|dr|way|blvd|boulevard|parade|pde|court|ct|lane|ln|crescent|cres|highway|hwy|beams)\b/i.test(
        p,
      ),
  );
  const locPart = parts.find(
    (p) => /\b(qld|queensland)\b/i.test(p) || /\b\d{4}\b/.test(p),
  );

  if (streetPart && locPart) {
    const street = normalizeUnits(streetPart);
    add(`${street}, ${locPart}`);
    add(`${street}, ${locPart}, Australia`);
  }

  for (const part of parts) {
    const cleaned = normalizeUnits(part);
    if (
      /\d/.test(cleaned) &&
      /\b(rd|road|st|street|ave|avenue|drive|dr|way|blvd|parade|court|lane|crescent|highway|hwy)\b/i.test(
        cleaned,
      )
    ) {
      add(cleaned);
      if (locPart && !cleaned.includes(locPart)) {
        add(`${cleaned}, ${locPart}`);
        add(`${cleaned}, ${locPart}, Australia`);
      }
    }
  }

  if (parts.length >= 2 && streetPart) {
    const withoutFirst = parts.slice(1).join(", ");
    add(withoutFirst);
    add(normalizeUnits(withoutFirst));
    add(stripAustralia(normalizeUnits(withoutFirst)));
  }

  return queries;
}

async function geocodeOneQuery(query) {
  const trimmed = String(query ?? "").trim();
  if (!trimmed) return null;

  const looksComplete =
    /,/.test(trimmed) && /\b(australia|qld|queensland)\b/i.test(trimmed);
  const searchQuery = looksComplete
    ? trimmed
    : `${trimmed}, Queensland, Australia`;

  const url = new URL(NOMINATIM);
  url.searchParams.set("format", "json");
  url.searchParams.set("q", searchQuery);
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "au");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "GHM-Backend/1.0 (drop-feed-submission)",
    },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (!Array.isArray(data) || !data.length) return null;

  for (const row of data) {
    const lat = Number.parseFloat(row.lat);
    const lng = Number.parseFloat(row.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (inSeqBounds(lat, lng)) return { lat, lng };
  }

  const lat = Number.parseFloat(data[0].lat);
  const lng = Number.parseFloat(data[0].lon);
  if (Number.isFinite(lat) && Number.isFinite(lng) && inSeqBounds(lat, lng)) {
    return { lat, lng };
  }

  return null;
}

const geocodeAddress = async (address) => {
  const queries = buildGeocodeQueries(address);
  if (!queries.length) return null;

  for (const q of queries) {
    const coords = await geocodeOneQuery(q);
    if (coords) return coords;
  }

  return null;
};

const delay = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** Cache + ~1 req/s for Nominatim usage policy. */
const createGeocodeResolver = () => {
  const cache = new Map();

  return async (address) => {
    const key = String(address ?? "").trim().toLowerCase();
    if (!key) return null;

    if (cache.has(key)) return cache.get(key);

    const coords = await geocodeAddress(address);
    cache.set(key, coords);

    await delay(1100);

    return coords;
  };
};

module.exports = {
  geocodeAddress,
  buildGeocodeQueries,
  createGeocodeResolver,
};
