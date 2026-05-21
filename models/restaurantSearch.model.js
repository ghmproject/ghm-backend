const prisma = require("../config/prisma");
const { searchMealsByFts } = require("../utils/restaurantFts");

const shapeMealRow = (m) => ({
  id: m.id,
  dishName: m.dishName,
  price: Number(m.price),
  image: m.image,
  isFeatured: Boolean(m.isFeatured),
  featuredUntil: m.featuredUntil,
  restaurantId: m.restaurantId,
  restaurant: {
    id: m.restaurant.id,
    name: m.restaurant.name,
    suburb: m.restaurant.suburb,
  },
});

/** All approved public meals for admin featured toggles. */
const listAllApprovedMealsForAdmin = async (limit = 100) => {
  const take = Math.min(Math.max(Number(limit) || 100, 1), 200);

  const meals = await prisma.meal.findMany({
    where: {
      status: "APPROVED",
      isHidden: false,
    },
    include: {
      restaurant: true,
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take,
  });

  return meals.map(shapeMealRow);
};

const searchRestaurantsForAdmin = async (query, limit) => {
  return searchMealsByFts(query, limit);
};

module.exports = {
  listAllApprovedMealsForAdmin,
  searchRestaurantsForAdmin,
};
