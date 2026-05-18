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
  image,
  latitude,
  longitude,
}) => {

  return await prisma.restaurant.create({
    data: {

      name,

      suburb,

      image,

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
  { latitude, longitude, image }
) => {

  const data = {};

  if (latitude != null) {
    data.latitude = latitude;
  }

  if (longitude != null) {
    data.longitude = longitude;
  }

  if (
    image != null &&
    image !== ""
  ) {
    data.image = image;
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

  status,

}) => {

  const data = {

    restaurantId,

    dishName,

    cuisine,

    price,
  };


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
const getSingleRestaurant =
  async (id) => {

    return await prisma.restaurant.findFirst({

      where: {

        id: Number(id),

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
  };


// =======================================
// FILTER LISTINGS
// =======================================
const filterListings = async ({
  cuisine,
  maxPrice,
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


  const where = {

    meals: {

      some: mealFilter,
    },
  };


  return await prisma.restaurant.findMany({

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