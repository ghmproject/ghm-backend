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
  const data = {
    latitude,
    longitude,
  };
  if (image !== undefined && image !== null) {
    data.image = image;
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
  price,
}) => {
  return await prisma.meal.create({
    data: {
      restaurantId,
      dishName,
      price,
    },
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

module.exports = {
  findRestaurant,
  createRestaurant,
  updateRestaurantLocation,
  createMeal,
  getApprovedRestaurants,
  getSingleRestaurant,
};