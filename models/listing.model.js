const prisma = require("../config/prisma");


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
// UPDATE RESTAURANT LOCATION (AND IMAGE)
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

  if (image != null && image !== "") {
    data.image = image;
  }

  if (!Object.keys(data).length) {
    return await prisma.restaurant.findUnique({
      where: { id: Number(id) },
    });
  }

  return await prisma.restaurant.update({
    where: { id: Number(id) },
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
// GET ALL APPROVED RESTAURANTS
// =======================================
const getApprovedRestaurants =
  async () => {
    return await prisma.restaurant.findMany({
      include: {
        meals: {
          where: {
            status: "APPROVED",
          },
        },
      },
    });
  };


// =======================================
// GET SINGLE RESTAURANT
// =======================================
const getSingleRestaurant =
  async (id) => {
    return await prisma.restaurant.findUnique({
      where: {
        id: Number(id),
      },

      include: {
        meals: true,
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

  const where = {
    meals: {
      some: {
        status: "APPROVED",
      },
    },
  };

  // ===================================
  // CUISINE FILTER
  // ===================================
  if (
    cuisine &&
    cuisine.toLowerCase() !== "all"
  ) {
    where.meals.some.cuisine = {
      equals: cuisine,
      mode: "insensitive",
    };
  }

  // ===================================
  // PRICE FILTER
  // ===================================
  if (maxPrice) {
    where.meals.some.price = {
      lte: Number(maxPrice),
    };
  }

  return await prisma.restaurant.findMany({
    where,

    include: {
      meals: {
        where: {
          status: "APPROVED",
        },
      },
    },
  });
};



module.exports = {
  findRestaurant,
  createRestaurant,
  updateRestaurantLocation,
  createMeal,
  getApprovedRestaurants,
  getSingleRestaurant,
  filterListings,
};