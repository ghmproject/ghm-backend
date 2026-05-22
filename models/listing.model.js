const prisma = require("../config/prisma");

const {
  publicApprovedMealWhere,
} = require("../utils/mealPublicFilter");


// =======================================
// FIND EXISTING RESTAURANT
// =======================================
const findRestaurant = async (
  name,
  suburb
) => {

  return await prisma.restaurant.findFirst({
    where: {

      name: {
        equals: name,
        mode: "insensitive",
      },

      suburb: {
        equals: suburb,
        mode: "insensitive",
      },
    },
  });
};


// =======================================
// CREATE RESTAURANT
// =======================================
const createRestaurant = async ({
  name,
  suburb,
  latitude,
  longitude,
}) => {

  return await prisma.restaurant.create({
    data: {

      name,

      suburb,

      latitude,

      longitude,
    },
  });
};


// =======================================
// UPDATE RESTAURANT LOCATION
// =======================================
const updateRestaurantLocation = async (
  id,
  { latitude, longitude }
) => {

  const data = {};

  if (latitude != null) {
    data.latitude = latitude;
  }

  if (longitude != null) {
    data.longitude = longitude;
  }

  if (!Object.keys(data).length) {

    return await prisma.restaurant.findUnique({
      where: {
        id: Number(id),
      },
    });
  }

  return await prisma.restaurant.update({

    where: {
      id: Number(id),
    },

    data,
  });
};


// =======================================
// CREATE MEAL
// =======================================
const createMeal = async ({

  restaurantId,

  dishName,

  cuisine,

  price,

  image,

  status,

}) => {

  const data = {

    restaurantId,

    dishName,

    cuisine,

    price,
  };

  if (image != null && image !== "") {
    data.image = image;
  }

  if (status) {
    data.status = status;
  }


  return await prisma.meal.create({
    data,
  });
};


// =======================================
// CREATE HOT DEAL
// =======================================
const createHotDeal = async ({

  mealId,

  startDateTime,

  endDateTime,

  description,

}) => {

  return await prisma.hotDeal.create({

    data: {

      mealId,

      startDateTime,

      endDateTime,

      description,

      isActive: true,
    },
  });
};


// =======================================
// GET ALL APPROVED RESTAURANTS
// =======================================
const getApprovedRestaurants =
  async () => {

    const restaurants =
      await prisma.restaurant.findMany({

        where: {

          meals: {

            some: publicApprovedMealWhere,
          },
        },

        include: {

          meals: {

            where: publicApprovedMealWhere,

            include: {
              hotDeals: true,
            },
          },
        },
      });


    // FORMAT HOT DEALS
    const formattedRestaurants =
      restaurants.map((restaurant) => {

        const formattedMeals =
          restaurant.meals.map((meal) => {

            const formattedDeals =
              meal.hotDeals.map((deal) => {

                const remainingMs =
                  new Date(deal.endDateTime) -
                  new Date();

                const totalMinutes =
                  Math.floor(
                    remainingMs / (1000 * 60)
                  );

                const hours =
                  Math.floor(totalMinutes / 60);

                const minutes =
                  totalMinutes % 60;

                return {

                  ...deal,

                  remainingMs,

                  countdown:
                    `${hours}h ${minutes}m left`,
                };
              });

            return {

              ...meal,

              hotDeals:
                formattedDeals,
            };
          });

        return {

          ...restaurant,

          meals:
            formattedMeals,
        };
      });

    return formattedRestaurants;
  };


// =======================================
// GET SINGLE RESTAURANT
// =======================================
const restaurantDetailInclude = {
  meals: {
    where: publicApprovedMealWhere,
    include: {
      hotDeals: true,
    },
  },
};

const getSingleRestaurant = async (id) => {
  const numId = Number(id);
  if (!Number.isFinite(numId)) return null;

  const byRestaurant = await prisma.restaurant.findFirst({
    where: {
      id: numId,
      meals: {
        some: publicApprovedMealWhere,
      },
    },
    include: restaurantDetailInclude,
  });

  if (byRestaurant) return byRestaurant;

  const meal = await prisma.meal.findFirst({
    where: {
      id: numId,
      ...publicApprovedMealWhere,
    },
    select: { restaurantId: true },
  });

  if (!meal) return null;

  return prisma.restaurant.findFirst({
    where: {
      id: meal.restaurantId,
      meals: {
        some: publicApprovedMealWhere,
      },
    },
    include: restaurantDetailInclude,
  });
};


// =======================================
// FILTER LISTINGS
// =======================================
const { getRestaurantRankingRows } = require("./rankingSystem.model");

/** Navbar “Top Rated” chip — ranking vote net score. */
/** Filter feeds “Top rated” — minimum restaurant popularity score (net score). */
const TOP_RATED_FILTER_MIN_POPULARITY_SCORE = 50;
const PRICE_VERIFIED_WINDOW_DAYS = 30;

const isActiveHotDeal = (deal, now = new Date()) =>
  deal.isActive &&
  new Date(deal.startDateTime) <= now &&
  new Date(deal.endDateTime) >= now;

const filterListings = async ({
  cuisine,
  maxPrice,
  topRated,
  hotDeals,
  priceVerified,
  minVotes,
  lat,
  lng,
  radiusKm,
}) => {

  const mealFilter = {
    ...publicApprovedMealWhere,
  };


  if (
    cuisine &&
    cuisine.toLowerCase() !== "all"
  ) {

    mealFilter.cuisine = {

      equals: cuisine,

      mode: "insensitive",
    };
  }


  if (maxPrice) {

    mealFilter.price = {
      lte: Number(maxPrice),
    };
  }

  const now = new Date();

  if (hotDeals) {
    mealFilter.hotDeals = {
      some: {
        isActive: true,
        startDateTime: { lte: now },
        endDateTime: { gte: now },
      },
    };
  }


  const where = {

    meals: {

      some: mealFilter,
    },
  };


  let listings = await prisma.restaurant.findMany({

    where,

    include: {

      meals: {

        where: mealFilter,

        include: {
          hotDeals: true,
        },
      },
    },
  });

  if (hotDeals) {
    listings = listings
      .map((restaurant) => ({
        ...restaurant,
        meals: restaurant.meals.filter((meal) =>
          (meal.hotDeals ?? []).some((deal) => isActiveHotDeal(deal, now)),
        ),
      }))
      .filter((restaurant) => restaurant.meals.length > 0);
  }

  if (priceVerified) {
    const cutoff = new Date(
      Date.now() - PRICE_VERIFIED_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );
    listings = listings
      .map((restaurant) => ({
        ...restaurant,
        meals: restaurant.meals.filter(
          (meal) => new Date(meal.createdAt) >= cutoff,
        ),
      }))
      .filter((restaurant) => restaurant.meals.length > 0);
  }

  if (!topRated) {
    return listings;
  }

  const latNum = lat != null ? Number(lat) : null;
  const lngNum = lng != null ? Number(lng) : null;
  const hasCoords =
    Number.isFinite(latNum) && Number.isFinite(lngNum);

  const { rows } = await getRestaurantRankingRows({
    suburb: null,
    lat: hasCoords ? latNum : null,
    lng: hasCoords ? lngNum : null,
    radiusKm,
  });

  const qualifyingRows = rows.filter(
    (row) => row.popularityScore >= TOP_RATED_FILTER_MIN_POPULARITY_SCORE,
  );

  const metricsByRestaurantId = new Map(
    qualifyingRows.map((row) => [
      row.restaurantId,
      {
        voteScore: row.voteScore,
        totalVotes: row.upvotes + row.downvotes,
        popularityScore: row.popularityScore,
      },
    ]),
  );

  const qualifyingIds = new Set(metricsByRestaurantId.keys());

  return listings
    .filter((restaurant) => qualifyingIds.has(restaurant.id))
    .map((restaurant) => {
      const metrics = metricsByRestaurantId.get(restaurant.id);
      return {
        ...restaurant,
        netScore: metrics.voteScore,
        voteCount: metrics.totalVotes,
        popularityScore: metrics.popularityScore,
      };
    })
    .sort(
      (a, b) =>
        (b.popularityScore ?? 0) - (a.popularityScore ?? 0) ||
        b.netScore - a.netScore,
    );
};


// =======================================
// GET ACTIVE HOT DEALS
// =======================================
const getActiveHotDeals =
  async () => {

    const now = new Date();

    const deals =
      await prisma.hotDeal.findMany({

        where: {

          isActive: true,

          startDateTime: {
            lte: now,
          },

          endDateTime: {
            gte: now,
          },

          meal: publicApprovedMealWhere,
        },

        include: {

          meal: {

            include: {
              restaurant: true,
            },
          },
        },

        orderBy: {
          endDateTime: "asc",
        },
      });


    // FORMAT RESPONSE
    const formattedDeals =
      deals.map((deal) => {

        const remainingMs =
          new Date(deal.endDateTime) -
          new Date();

        const totalMinutes =
          Math.floor(
            remainingMs / (1000 * 60)
          );

        const hours =
          Math.floor(totalMinutes / 60);

        const minutes =
          totalMinutes % 60;

        return {

          ...deal,

          remainingMs,

          countdown:
            `${hours}h ${minutes}m left`,
        };
      });

    return formattedDeals;
  };


module.exports = {
  findRestaurant,
  createRestaurant,
  updateRestaurantLocation,
  createMeal,
  createHotDeal,
  getApprovedRestaurants,
  getSingleRestaurant,
  filterListings,
  getActiveHotDeals,
};