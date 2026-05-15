const cloudinary = require(
  "../config/cloudinary"
);

const streamifier = require(
  "streamifier"
);

const { parseCoordinates } = require("../utils/parseCoordinates");

const {
  findRestaurant,
  createRestaurant,
  updateRestaurantLocation,
  createMeal,
  getApprovedRestaurants,
  getSingleRestaurant,
  filterListings,
} = require("../models/listing.model");

// =======================================
// CREATE SUBMISSION
// =======================================
const createSubmission = async (
  req,
  res
) => {
  try {
    const {
      restaurantName, suburb, dishName, cuisine, price, latitude, longitude,
    } = req.body;

    // Validation
    if (
      !restaurantName ||
      !suburb ||
      !dishName ||
      price === undefined ||
      price === null ||
      price === ""
    ) {
      return res.status(400).json({
        success: false,
        message:
          "restaurantName, suburb, dishName, price, latitude, and longitude are required",
      });
    }

    const coords = parseCoordinates(latitude, longitude);
    if (!coords.ok) {
      return res.status(coords.status).json({
        success: false,
        message: coords.message,
      });
    }

    const priceNum = Number(price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({
        success: false,
        message: "price must be a valid non-negative number",
      });
    }

    // ===================================
    // IMAGE UPLOAD
    // ===================================
    let image = null;

    if (req.file) {
      const streamUpload = () => {
        return new Promise(
          (resolve, reject) => {
            const stream =
              cloudinary.uploader.upload_stream(
                {
                  folder: "GHMProject",
                },

                (error, result) => {
                  if (result) {
                    resolve(result);
                  } else {
                    reject(error);
                  }
                }
              );

            streamifier
              .createReadStream(
                req.file.buffer
              )
              .pipe(stream);
          }
        );
      };

      const result =
        await streamUpload();

      image = result.secure_url;
    }

    // ===================================
    // CHECK EXISTING RESTAURANT
    // ===================================
    let restaurant =
      await findRestaurant(
        restaurantName,
        suburb
      );

    // ===================================
    // CREATE RESTAURANT IF NOT EXISTS
    // ===================================
    if (!restaurant) {
      restaurant =
        await createRestaurant({
          name: restaurantName,
          suburb,
          image,
          latitude: coords.lat,
          longitude: coords.lng,
        });
    } else {
      restaurant =
        await updateRestaurantLocation(
          restaurant.id,
          {
            latitude: coords.lat,
            longitude: coords.lng,
            image,
          }
        );
    }

    // ===================================
    // CREATE MEAL
    // ===================================
    const meal = await createMeal({
      restaurantId: restaurant.id, dishName, cuisine, price: priceNum,
    });

    return res.status(201).json({
      success: true,

      message:
        "Submission sent for moderation",

      restaurant,
      meal,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// =======================================
// GET RESTAURANTS
// =======================================
const getListings = async (
  req,
  res
) => {
  try {
    const restaurants =
      await getApprovedRestaurants();

    return res.status(200).json({
      success: true,
      data: restaurants,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// =======================================
// GET SINGLE RESTAURANT
// =======================================
const getListing = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const restaurant =
      await getSingleRestaurant(id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message:
          "Restaurant not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// =======================================
// FILTER LISTINGS
// =======================================
const filterListingController =
  async (req, res) => {
    try {

      const {
        cuisine,
        maxPrice,
      } = req.query;

      const listings =
        await filterListings({
          cuisine,
          maxPrice,
        });

      return res.status(200).json({
        success: true,
        count: listings.length,
        data: listings,
      });

    } catch (error) {

      console.log(error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };


module.exports = {
  createSubmission,
  getListings,
  getListing,
  filterListingController,
};