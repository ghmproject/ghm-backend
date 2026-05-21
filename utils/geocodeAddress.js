/**
 * Geocode a street address via Nominatim (server-side).
 * CSV `suburb` column should contain the full restaurant address.
 */
const geocodeAddress = async (address) => {
  const trimmed = String(address ?? "").trim();
  if (!trimmed) {
    return null;
  }

  const looksComplete =
    /,/.test(trimmed) && /\b(australia|qld|queensland)\b/i.test(trimmed);
  const searchQuery = looksComplete
    ? trimmed
    : `${trimmed}, Queensland, Australia`;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", searchQuery);
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "au");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "GHM-Backend/1.0 (admin-csv-import)",
    },
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  if (!Array.isArray(data) || !data.length) {
    return null;
  }

  const lat = Number.parseFloat(data[0].lat);
  const lng = Number.parseFloat(data[0].lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
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
    if (!key) {
      return null;
    }

    if (cache.has(key)) {
      return cache.get(key);
    }

    const coords = await geocodeAddress(address);
    cache.set(key, coords);

    await delay(1100);

    return coords;
  };
};

module.exports = {
  geocodeAddress,
  createGeocodeResolver,
};
