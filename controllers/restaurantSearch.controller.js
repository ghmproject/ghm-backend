const {
  listAllApprovedMealsForAdmin,
  searchRestaurantsForAdmin,
} = require("../models/restaurantSearch.model");
const {
  normalizeSearchQuery,
  MIN_SEARCH_LEN,
} = require("../utils/restaurantFts");

/**
 * GET /api/admin/restaurants/search?q=
 */
const searchRestaurantsController = async (req, res) => {
  try {
    const q = normalizeSearchQuery(req.query.q ?? req.query.search);
    const limitRaw = Number(req.query.limit);
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0
        ? Math.min(Math.floor(limitRaw), 200)
        : q.length >= MIN_SEARCH_LEN
          ? 50
          : 100;

    const data =
      q.length >= MIN_SEARCH_LEN
        ? await searchRestaurantsForAdmin(q, limit)
        : await listAllApprovedMealsForAdmin(limit);

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to search restaurants",
    });
  }
};

module.exports = {
  searchRestaurantsController,
};
