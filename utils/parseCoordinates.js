/**
 * Parse and validate latitude / longitude from query params or multipart body.
 * @param {unknown} latRaw
 * @param {unknown} lngRaw
 * @returns {{ ok: true, lat: number, lng: number } | { ok: false, status: number, message: string }}
 */
const parseCoordinates = (latRaw, lngRaw) => {
  if (latRaw === undefined || latRaw === null || latRaw === "") {
    return {
      ok: false,
      status: 400,
      message: "Latitude is required.",
    };
  }
  if (lngRaw === undefined || lngRaw === null || lngRaw === "") {
    return {
      ok: false,
      status: 400,
      message: "Longitude is required.",
    };
  }

  const lat = Number(latRaw);
  const lng = Number(lngRaw);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return {
      ok: false,
      status: 400,
      message: "Latitude and longitude must be valid numbers.",
    };
  }

  if (lat < -90 || lat > 90) {
    return {
      ok: false,
      status: 400,
      message: "Latitude must be between -90 and 90.",
    };
  }

  if (lng < -180 || lng > 180) {
    return {
      ok: false,
      status: 400,
      message: "Longitude must be between -180 and 180.",
    };
  }

  return { ok: true, lat, lng };
};

module.exports = { parseCoordinates };
