const cloudinary = require(
  "../config/cloudinary"
);

const streamifier = require(
  "streamifier"
);

const {
  parseCoordinates,
} = require(
  "../utils/parseCoordinates"
);

const {
  findRestaurant,
  createRestaurant,
  updateRestaurantLocation,
  createMeal,
  createHotDeal,
  getApprovedRestaurants,
  getSingleRestaurant,
  filterListings,
  getActiveHotDeals,
} = require(
  "../models/listing.model"
);


// =======================================
// CREATE SUBMISSION
// =======================================
const createSubmission = async (
  req,
  res
) => {

  try {

    const {

      restaurantName,
      suburb,
      dishName,
      cuisine,
      price,
      latitude,
      longitude,

      // HOT DEALS
      isHotDeal,
      hotDealStartDateTime,
      hotDealEndDateTime,
      hotDealDescription,

    } = req.body;


    // ===================================
    // BASIC VALIDATION
    // ===================================
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
          "restaurantName, suburb, dishName and price are required",
      });
    }


    // ===================================
    // LOCATION VALIDATION
    // ===================================
    const coords = parseCoordinates(
      latitude,
      longitude
    );

    if (!coords.ok) {

      return res.status(coords.status).json({
        success: false,

        message:
          coords.message,
      });
    }


    // ===================================
    // PRICE VALIDATION
    // ===================================
    const priceNum = Number(price);

    if (
      Number.isNaN(priceNum) ||
      priceNum < 0
    ) {

      return res.status(400).json({
        success: false,

        message:
          "price must be a valid non-negative number",
      });
    }


    // ===================================
// HOT DEAL VALIDATION
// ===================================
const hotDealEnabled =
isHotDeal === true ||
isHotDeal === "true";

let parsedStartDate = null;
let parsedEndDate = null;

if (hotDealEnabled) {

if (
  !hotDealStartDateTime ||
  !hotDealEndDateTime
) {

  return res.status(400).json({
    success: false,

    message:
      "hotDealStartDateTime and hotDealEndDateTime are required",
  });
}

parsedStartDate =
  new Date(hotDealStartDateTime);

parsedEndDate =
  new Date(hotDealEndDateTime);

// INVALID DATE CHECK
if (
  isNaN(parsedStartDate.getTime()) ||
  isNaN(parsedEndDate.getTime())
) {

  return res.status(400).json({
    success: false,

    message:
      "Invalid hot deal datetime format",
  });
}

// END MUST BE AFTER START
if (parsedStartDate >= parsedEndDate) {

  return res.status(400).json({
    success: false,

    message:
      "End datetime must be after start datetime",
  });
}
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

      image =
        result.secure_url;
    }


    // ===================================
    // FIND EXISTING RESTAURANT
    // ===================================
    let restaurant =
      await findRestaurant(
        restaurantName,
        suburb
      );


    // ===================================
    // CREATE RESTAURANT
    // ===================================
    if (!restaurant) {

      restaurant =
        await createRestaurant({

          name:
            restaurantName,

          suburb,

          latitude:
            coords.lat,

          longitude:
            coords.lng,
        });

    } else {

      restaurant =
        await updateRestaurantLocation(

          restaurant.id,

          {
            latitude:
              coords.lat,

            longitude:
              coords.lng,
          }
        );
    }


    // ===================================
    // CREATE MEAL
    // ===================================
    const meal =
      await createMeal({

        restaurantId:
          restaurant.id,

        dishName,

        cuisine,

        price:
          priceNum,

        image,
      });


    // ===================================
    // CREATE HOT DEAL
    // ===================================
    if (hotDealEnabled) {

      await createHotDeal({

        mealId:
          meal.id,
      
        startDateTime:
          parsedStartDate,
      
        endDateTime:
          parsedEndDate,
      
        description:
          hotDealDescription,
      });
    }


    return res.status(201).json({

      success: true,

      message:
        hotDealEnabled
          ? "Hot deal submitted successfully"
          : "Submission sent for moderation",

      restaurant,

      meal,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      success: false,

      message:
        "Internal server error",
    });
  }
};


// =======================================
// GET ALL LISTINGS
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

      data:
        restaurants,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      success: false,

      message:
        "Internal server error",
    });
  }
};


// =======================================
// GET SINGLE LISTING
// =======================================
const getListing = async (
  req,
  res
) => {

  try {

    const { id } =
      req.params;

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

      data:
        restaurant,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      success: false,

      message:
        "Internal server error",
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

        count:
          listings.length,

        data:
          listings,
      });

    } catch (error) {

      console.log(error);

      return res.status(500).json({

        success: false,

        message:
          "Internal server error",
      });
    }
  };


// =======================================
// GET ACTIVE HOT DEALS
// =======================================
const getHotDealsController =
  async (req, res) => {

    try {

      const deals =
        await getActiveHotDeals();

      return res.status(200).json({

        success: true,

        count:
          deals.length,

        data:
          deals,
      });

    } catch (error) {

      console.log(error);

      return res.status(500).json({

        success: false,

        message:
          "Internal server error",
      });
    }
  };


module.exports = {
  createSubmission,
  getListings,
  getListing,
  filterListingController,
  getHotDealsController,
};