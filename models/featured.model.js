const prisma = require("../config/prisma");
const {
  searchMealsByFts,
  normalizeSearchQuery,
  MIN_SEARCH_LEN,
} = require("../utils/restaurantFts");


// =========================================
// TOGGLE FEATURED LISTING
// =========================================
const toggleFeaturedListing =
  async ({

    mealId,

    isFeatured,

    featuredUntil,

  }) => {

    return await prisma.meal.update({

      where: {

        id:
          Number(mealId),
      },

      data: {

        isFeatured,

        featuredUntil:
          isFeatured
            ? new Date(featuredUntil)
            : null,
      },
    });
  };


// =========================================
// GET FEATURED LISTINGS
// =========================================
const getFeaturedListings = async (search) => {
  const q = normalizeSearchQuery(search);

  if (q.length >= MIN_SEARCH_LEN) {
    const rows = await searchMealsByFts(q, 50);
    return rows.filter((m) => m.isFeatured);
  }

  return prisma.meal.findMany({
    where: {
      isFeatured: true,
      status: "APPROVED",
      isHidden: false,
    },
    include: {
      restaurant: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};


module.exports = {

  toggleFeaturedListing,

  getFeaturedListings,
};