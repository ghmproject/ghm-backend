const { parseCoordinates } = require("./parseCoordinates");
const { geocodeAddress } = require("./geocodeAddress");

const SUBURB_ONLY_ERROR =
  "Enter the full street address (e.g. 735 Beams Rd, Carseldine QLD 4034). Suburb names only (West End, Sunnybank, East End, etc.) are not accepted.";

/**
 * True when input looks like a real street address (not suburb name only).
 */
function isFullAddress(input) {
  const t = String(input ?? "").trim();
  if (!t || t.length < 6) return false;

  const hasStreetNumber =
    /\b\d{1,5}[A-Za-z]?\s+[A-Za-z]/.test(t) ||
    /\b(?:shop|unit|suite|level|lot)\s*#?\s*\d+/i.test(t) ||
    /\b\d+\s*\/\s*\d+/.test(t);

  const hasStreetType =
    /\b(street|st|road|rd|avenue|ave|drive|dr|court|ct|parade|pde|lane|ln|way|blvd|boulevard|crescent|cres|highway|hwy|terrace|tce)\b/i.test(
      t,
    );

  if (hasStreetNumber && (hasStreetType || /,/.test(t))) return true;
  if (/^\d+\s+\S/.test(t) && hasStreetType) return true;
  if (/,/.test(t) && /\b\d{4}\b/.test(t) && hasStreetNumber) return true;

  if (
    /\b(street|st|road|rd|avenue|ave|drive|dr|court|ct|parade|pde|lane|ln|way|blvd|boulevard|crescent|cres|highway|hwy|central|shop)\b/i.test(
      t,
    ) &&
    /\d/.test(t)
  ) {
    return true;
  }

  return false;
}

/** Suburb nickname only (West End, Sunnybank, North End, …). */
function isSuburbNameOnly(suburb) {
  const raw = String(suburb ?? "").trim();
  if (!raw) return true;
  return !isFullAddress(raw);
}

/**
 * @param {{ suburb: string, latitude: unknown, longitude: unknown, pinnedLocation?: boolean }} params
 */
async function resolveSubmissionLocation({
  suburb,
  latitude,
  longitude,
  pinnedLocation,
}) {
  const clientCoords = parseCoordinates(latitude, longitude);
  if (!clientCoords.ok) {
    return clientCoords;
  }

  const usePin =
    pinnedLocation === true ||
    pinnedLocation === "true" ||
    pinnedLocation === 1 ||
    pinnedLocation === "1";

  if (usePin) {
    if (isSuburbNameOnly(suburb)) {
      return {
        ok: false,
        status: 400,
        message: SUBURB_ONLY_ERROR,
      };
    }

    return {
      ok: true,
      lat: clientCoords.lat,
      lng: clientCoords.lng,
      mode: "pin",
    };
  }

  if (isSuburbNameOnly(suburb)) {
    return {
      ok: false,
      status: 400,
      message: SUBURB_ONLY_ERROR,
    };
  }

  const geocoded = await geocodeAddress(suburb);
  if (geocoded) {
    return {
      ok: true,
      lat: geocoded.lat,
      lng: geocoded.lng,
      mode: "address",
    };
  }

  return {
    ok: false,
    status: 400,
    message:
      "Could not find that address. Check spelling and include street number, road name, suburb, and postcode.",
  };
}

module.exports = {
  resolveSubmissionLocation,
  isSuburbNameOnly,
  isFullAddress,
  SUBURB_ONLY_ERROR,
};
