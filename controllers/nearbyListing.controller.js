const { getDistance } = require("geolib");

const { parseCoordinates } = require("../utils/parseCoordinates");
const { extractSuburbLabel } = require("../utils/extractSuburbLabel");
const {
  findApprovedMealsWithRestaurantCoords,
} = require("../models/nearbyListing.model");

/** Default search radius (km). Override via ?radiusKm= on the nearby endpoint. */
const DEFAULT_RADIUS_KM =
  Number(process.env.NEARBY_MAX_RADIUS_KM) || 80;
const MAX_RADIUS_KM_CAP = 150;

function resolveRadiusMeters(radiusKmRaw) {
  const km = Number(radiusKmRaw);
  const radiusKm =
    Number.isFinite(km) && km > 0 ? km : DEFAULT_RADIUS_KM;
  return Math.min(radiusKm, MAX_RADIUS_KM_CAP) * 1000;
}

const toPublicNearbyListing = (row) => {
  const fullAddress = row.address ?? "";
  return {
    id: row.mealId,
    restaurantName: row.restaurantName,
    dishName: row.dishName,
    address: fullAddress,
    suburb: extractSuburbLabel(fullAddress),
    latitude: row.latitude,
    longitude: row.longitude,
    price: row.price,
    image: row.image ?? null,
    isFeatured: Boolean(row.isFeatured),
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : row.createdAt,
  };
};

/**
 * Validate coords, load approved listings with coordinates, filter by radius, sort nearest first.
 *
 * @returns {Promise<{ status: number, body: unknown }>}
 */
const getNearbyListingsPayload = async (
  latRaw,
  lngRaw,
  maxRadiusMeters
) => {
  const parsed = parseCoordinates(latRaw, lngRaw);
  if (!parsed.ok) {
    return {
      status: parsed.status,
      body: { success: false, message: parsed.message },
    };
  }

  const { lat, lng } = parsed;
  const origin = { latitude: lat, longitude: lng };

  const candidates = await findApprovedMealsWithRestaurantCoords();

  const enriched = candidates
    .map((row) => ({
      ...row,
      distanceMeters: getDistance(origin, {
        latitude: row.latitude,
        longitude: row.longitude,
      }),
    }))
    .filter((row) => row.distanceMeters <= maxRadiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  const data = enriched.map(toPublicNearbyListing);

  return {
    status: 200,
    body: {
      success: true,
      data,
    },
  };
};

const getNearbyListings = async (req, res) => {
  try {
    const { lat, lng, radiusKm } = req.query;
    const maxRadiusMeters = resolveRadiusMeters(radiusKm);
    const { status, body } = await getNearbyListingsPayload(
      lat,
      lng,
      maxRadiusMeters
    );
    return res.status(status).json(body);
  } catch (error) {
    console.error("getNearbyListings error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  getNearbyListings,
  getNearbyListingsPayload,
  DEFAULT_RADIUS_KM,
  resolveRadiusMeters,
};
