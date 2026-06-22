const { buildGeocodeQueries } = require("../utils/geocodeAddress");
const { extractSuburbLabel } = require("../utils/extractSuburbLabel");
const { decodeGooglePolyline } = require("../utils/decodeGooglePolyline");

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_REVERSE = "https://nominatim.openstreetmap.org/reverse";
const OSRM_BASE = "https://router.project-osrm.org";
const MAX_DESTINATIONS = 100;
const GOOGLE_BATCH = 25;

const BRISBANE_BOUNDS = {
  south: -27.95,
  west: 152.48,
  north: -26.98,
  east: 153.62,
};

function inBrisbane(lat, lng) {
  return (
    lat >= BRISBANE_BOUNDS.south &&
    lat <= BRISBANE_BOUNDS.north &&
    lng >= BRISBANE_BOUNDS.west &&
    lng <= BRISBANE_BOUNDS.east
  );
}

function isValidCoord(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function googleMapsKey() {
  return String(process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "").trim();
}

async function geocodeOneQuery(searchQuery) {
  const viewbox = `${BRISBANE_BOUNDS.west},${BRISBANE_BOUNDS.south},${BRISBANE_BOUNDS.east},${BRISBANE_BOUNDS.north}`;
  const looksComplete =
    /,/.test(searchQuery) && /\b(australia|qld|queensland)\b/i.test(searchQuery);
  const q = looksComplete ? searchQuery : `${searchQuery}, Queensland, Australia`;

  const url = new URL(NOMINATIM);
  url.searchParams.set("format", "json");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "6");
  url.searchParams.set("countrycodes", "au");
  url.searchParams.set("viewbox", viewbox);
  url.searchParams.set("bounded", "0");

  let res;
  try {
    res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "GuessHowMuch/1.0 (ghm-backend maps)",
      },
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;

  const data = await res.json();
  if (!Array.isArray(data)) return null;

  for (const row of data) {
    const lat = Number.parseFloat(row.lat);
    const lng = Number.parseFloat(row.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (inBrisbane(lat, lng)) {
      return { lat, lng, label: row.display_name };
    }
  }

  return null;
}

function formatAddressFromParts(addr, displayName) {
  const suburb =
    addr.suburb || addr.city_district || addr.city || addr.town || addr.village || "";
  const street = [addr.house_number, addr.road].filter(Boolean).join(" ");
  const state = addr.state ?? "QLD";
  const postcode = addr.postcode ?? "";

  if (street && suburb) {
    return `${street}, ${suburb} ${state}${postcode ? ` ${postcode}` : ""}`
      .replace(/\s+/g, " ")
      .trim();
  }

  return displayName.replace(/, Australia\s*$/i, "").trim();
}

function toDrivingRoutes(raw) {
  const sorted = [...raw].sort(
    (a, b) => a.durationMin - b.durationMin || a.distanceKm - b.distanceKm,
  );

  return {
    options: sorted.map((r, i) => ({
      id: `route-${i}`,
      title: i === 0 ? "Fastest route" : "Alternate route",
      hint: i > 0 ? "You can also go this way" : undefined,
      path: r.path,
      distanceKm: r.distanceKm,
      durationMin: r.durationMin,
    })),
  };
}

function googleRouteMetrics(route) {
  let meters = 0;
  let seconds = 0;
  for (const leg of route.legs ?? []) {
    meters += leg.distance?.value ?? 0;
    seconds += leg.duration?.value ?? 0;
  }
  return {
    distanceKm: meters / 1000,
    durationMin: Math.max(1, Math.round(seconds / 60)),
  };
}

async function googleRoutes(origin, destination) {
  const key = googleMapsKey();
  if (!key) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
  url.searchParams.set("origin", `${origin.lat},${origin.lng}`);
  url.searchParams.set("destination", `${destination.lat},${destination.lng}`);
  url.searchParams.set("mode", "driving");
  url.searchParams.set("alternatives", "true");
  url.searchParams.set("key", key);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const json = await res.json();
  if (json.status !== "OK" || !json.routes?.length) return null;

  const raw = [];
  for (const route of json.routes) {
    const encoded = route.overview_polyline?.points;
    if (!encoded) continue;
    const path = decodeGooglePolyline(encoded);
    if (!path.length) continue;
    raw.push({ path, ...googleRouteMetrics(route) });
  }

  return raw.length ? toDrivingRoutes(raw) : null;
}

async function osrmRoutes(origin, destination) {
  const coordStr = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `${OSRM_BASE}/route/v1/driving/${coordStr}?overview=full&geometries=geojson&alternatives=true`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const json = await res.json();
  if (json.code !== "Ok" || !json.routes?.length) return null;

  const raw = [];
  for (const route of json.routes) {
    const coords = route.geometry?.coordinates;
    if (!coords?.length) continue;
    raw.push({
      path: coords.map(([lng, lat]) => ({ lat, lng })),
      distanceKm: (route.distance ?? 0) / 1000,
      durationMin: Math.max(1, Math.round((route.duration ?? 0) / 60)),
    });
  }

  return raw.length ? toDrivingRoutes(raw) : null;
}

async function googleDrivingKm(origin, destinations) {
  const key = googleMapsKey();
  if (!key) return {};

  const out = {};
  for (let i = 0; i < destinations.length; i += GOOGLE_BATCH) {
    const batch = destinations.slice(i, i + GOOGLE_BATCH);
    const destParam = batch.map((d) => `${d.lat},${d.lng}`).join("|");
    const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
    url.searchParams.set("origins", `${origin.lat},${origin.lng}`);
    url.searchParams.set("destinations", destParam);
    url.searchParams.set("mode", "driving");
    url.searchParams.set("key", key);

    const res = await fetch(url.toString());
    if (!res.ok) continue;

    const json = await res.json();
    const elements = json.rows?.[0]?.elements ?? [];
    batch.forEach((dest, idx) => {
      const el = elements[idx];
      if (el?.status === "OK" && el.distance?.value != null) {
        out[dest.id] = el.distance.value / 1000;
      }
    });
  }

  return out;
}

async function osrmDrivingKm(origin, destinations) {
  const out = {};
  const CHUNK = 50;

  for (let i = 0; i < destinations.length; i += CHUNK) {
    const batch = destinations.slice(i, i + CHUNK);
    const points = [origin, ...batch];
    const coordStr = points.map((p) => `${p.lng},${p.lat}`).join(";");
    const destIdx = batch.map((_, j) => j + 1).join(";");

    const url = `${OSRM_BASE}/table/v1/driving/${coordStr}?sources=0&destinations=${destIdx}&annotations=distance`;
    const res = await fetch(url);
    if (!res.ok) continue;

    const json = await res.json();
    if (json.code !== "Ok" || !json.distances?.[0]) continue;

    batch.forEach((dest, j) => {
      const meters = json.distances[0][j];
      if (meters != null && Number.isFinite(meters) && meters >= 0) {
        out[dest.id] = meters / 1000;
      }
    });
  }

  return out;
}

exports.handleMapsGet = async (req, res) => {
  const action = req.query.action;

  if (action === "geocode") {
    const q = String(req.query.q ?? "").trim();
    if (!q || q.length < 2) return res.json(null);

    const queries = buildGeocodeQueries(q);
    const toTry = queries.length > 0 ? queries : [q];

    for (const query of toTry) {
      const hit = await geocodeOneQuery(query);
      if (hit) return res.json(hit);
    }

    return res.json(null);
  }

  if (action === "reverse-geocode") {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ success: false, message: "lat and lng are required" });
    }

    if (!inBrisbane(lat, lng)) {
      return res.status(400).json({
        success: false,
        message: "Pin must be within the Greater Brisbane area.",
      });
    }

    const url = new URL(NOMINATIM_REVERSE);
    url.searchParams.set("format", "json");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("zoom", "18");

    let response;
    try {
      response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "GuessHowMuch/1.0 (ghm-backend reverse-geocode)",
        },
      });
    } catch {
      return res.status(502).json({ success: false, message: "Could not reach geocoding service." });
    }

    if (!response.ok) {
      return res.status(502).json({ success: false, message: "Reverse geocode failed." });
    }

    const data = await response.json();
    const displayName = String(data.display_name ?? "").trim();
    if (!displayName) {
      return res.status(404).json({ success: false, message: "No address found for this location." });
    }

    const addr = data.address ?? {};
    const address = formatAddressFromParts(addr, displayName);
    const suburb =
      extractSuburbLabel(address) ||
      extractSuburbLabel(addr.suburb || addr.city || addr.town || addr.village || displayName);

    return res.json({
      success: true,
      lat,
      lng,
      address,
      suburb,
      label: displayName,
    });
  }

  return res.status(400).json({ error: "action is required" });
};

exports.handleMapsPost = async (req, res) => {
  const action = req.body?.action;

  if (action === "driving-route") {
    const { origin, destination } = req.body ?? {};

    if (
      !origin ||
      !destination ||
      !isValidCoord(origin.lat, origin.lng) ||
      !isValidCoord(destination.lat, destination.lng)
    ) {
      return res.status(400).json({ error: "origin and destination required" });
    }

    let routes = await googleRoutes(origin, destination);
    if (!routes?.options?.length) {
      routes = await osrmRoutes(origin, destination);
    }

    if (!routes?.options?.length) {
      return res.status(404).json({ error: "Route not found" });
    }

    return res.json(routes);
  }

  if (action === "driving-distances") {
    const { origin, destinations } = req.body ?? {};

    if (
      !origin ||
      !isValidCoord(origin.lat, origin.lng) ||
      !Array.isArray(destinations) ||
      destinations.length === 0
    ) {
      return res.status(400).json({ error: "origin and destinations required" });
    }

    if (destinations.length > MAX_DESTINATIONS) {
      return res.status(400).json({ error: `At most ${MAX_DESTINATIONS} destinations` });
    }

    const validDests = destinations.filter((d) => d?.id && isValidCoord(d.lat, d.lng));
    let distances = await googleDrivingKm(origin, validDests);

    const missing = validDests.filter((d) => distances[d.id] == null);
    if (missing.length > 0) {
      distances = { ...distances, ...(await osrmDrivingKm(origin, missing)) };
    }

    return res.json({ distances });
  }

  return res.status(400).json({ error: "action is required" });
};
