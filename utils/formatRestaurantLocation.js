const { extractSuburbLabel } = require("./extractSuburbLabel");

/**
 * API shape: `suburb` = display label, `address` = full text stored in DB.
 * DB column `suburb` on the model is unchanged (full address).
 */
function formatRestaurantForApi(restaurant) {
  if (!restaurant) return restaurant;

  const fullAddress = restaurant.suburb ?? restaurant.address ?? "";
  const displaySuburb = extractSuburbLabel(fullAddress);

  return {
    ...restaurant,
    address: fullAddress,
    suburb: displaySuburb || fullAddress,
  };
}

function formatRestaurantsForApi(restaurants) {
  if (!Array.isArray(restaurants)) return restaurants;
  return restaurants.map(formatRestaurantForApi);
}

module.exports = {
  formatRestaurantForApi,
  formatRestaurantsForApi,
};
