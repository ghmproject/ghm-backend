const prisma = require("../config/prisma");

const {
  publicApprovedMealWhere,
} = require("../utils/mealPublicFilter");

/**
 * Approved meals whose restaurant has map coordinates.
 * One row per meal (same restaurant may appear multiple times).
 */
const findApprovedMealsWithRestaurantCoords = async () => {
  const restaurants = await prisma.restaurant.findMany({
    where: {
      // Prisma rejects `{ not: null }` on optional Float fields ("Argument `not` must not be null").
      // Bounded comparisons exclude NULL in SQL and match real map coordinates.
      AND: [
        { latitude: { gte: -90, lte: 90 } },
        { longitude: { gte: -180, lte: 180 } },
      ],
      meals: { some: publicApprovedMealWhere },
    },
    include: {
      meals: {
        where: publicApprovedMealWhere,
      },
    },
  });

  const rows = [];
  for (const r of restaurants) {
    for (const m of r.meals) {
      const featuredActive =
        m.isFeatured &&
        (!m.featuredUntil || new Date(m.featuredUntil) > new Date());

      rows.push({
        id: m.id,
        mealId: m.id,
        restaurantName: r.name,
        dishName: m.dishName,
        address: r.suburb,
        latitude: r.latitude,
        longitude: r.longitude,
        price: m.price,
        image: m.image,
        isFeatured: featuredActive,
      });
    }
  }
  return rows;
};

module.exports = {
  findApprovedMealsWithRestaurantCoords,
};
