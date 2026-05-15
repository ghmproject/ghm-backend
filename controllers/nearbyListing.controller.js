const { getDistance } = require("geolib");

const { parseCoordinates } = require("../utils/parseCoordinates");
const {
  findApprovedMealsWithRestaurantCoords,
} = require("../models/nearbyListing.model");

const MAX_RADIUS_METERS = 5000;

const toPublicNearbyListing = (row) => ({
  id: row.mealId,
  restaurantName: row.restaurantName,
  dishName: row.dishName,
  address: row.address,
  latitude: row.latitude,
  longitude: row.longitude,
  price: row.price,
});

/**
 * Validate coords, load approved listings with coordinates, filter by radius, sort nearest first.
 *
 * @returns {Promise<{ status: number, body: unknown }>}
 */
const getNearbyListingsPayload = async (latRaw, lngRaw) => {
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
    .filter((row) => row.distanceMeters <= MAX_RADIUS_METERS)
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
    const { lat, lng } = req.query;
    const { status, body } = await getNearbyListingsPayload(lat, lng);
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
  MAX_RADIUS_METERS,
};
