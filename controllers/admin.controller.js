const {
  uploadCsvImageToCloudinary,
} = require("../utils/uploadCsvImageToCloudinary");

const { createGeocodeResolver } = require("../utils/geocodeAddress");

const {
  REQUIRED_CSV_COLUMNS, 
  isExcelBuffer,
  parseImportSpreadsheet,
  getCsvHeaderReport,
  normalizeImportRow,
} = require("../utils/parseImportSpreadsheet");

const {
  getPendingMeals,
  approveMeal,
  rejectMeal,
} = require("../models/admin.model");

const {
  getReportedOrHiddenMeals,
  restoreMealVisibility,
  softRejectReportedListing,
} = require("../models/adminModeration.model");

const {
  findRestaurant,
  createRestaurant,
  updateRestaurantLocation,
  createMeal,
} = require("../models/listing.model");

// ======================================
// GET PENDING REQUESTS
// ======================================
const getPendingRequests =
  async (req, res) => {
    try {
      const meals =
        await getPendingMeals();

      return res.status(200).json({
        success: true,
        data: meals,
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

// ======================================
// APPROVE REQUEST
// ======================================
const approveRequest =
  async (req, res) => {
    try {
      const { id } = req.params;

      const meal =
        await approveMeal(id);

      return res.status(200).json({
        success: true,
        message:
          "Meal approved successfully",
        data: meal,
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

// ======================================
// REJECT REQUEST
// ======================================
const rejectRequest =
  async (req, res) => {
    try {
      const { id } = req.params;

      const meal =
        await rejectMeal(id);

      return res.status(200).json({
        success: true,
        message:
          "Meal rejected successfully",
        data: meal,
      });
    } catch (error) {
      console.log(error);

      if (error.code === "P2025") {
        return res.status(404).json({
          success: false,
          message: "Meal not found",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Internal server error",
      });
    }
  };

// ======================================
// IMPORT CSV
// ======================================
const importCsvController =
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "CSV file is required (field: file)",
        });
      }

      const fileName = req.file.originalname.toLowerCase();
      const isCsv = fileName.endsWith(".csv");
      const isXlsx = fileName.endsWith(".xlsx");

      if (!isCsv && !isXlsx) {
        return res.status(400).json({
          success: false,
          message:
            "Upload a .csv or .xlsx file (Excel: File → Save As → CSV UTF-8, or upload .xlsx directly)",
        });
      }

      if (isCsv && isExcelBuffer(req.file.buffer)) {
        return res.status(400).json({
          success: false,
          message:
            "This file is an Excel workbook, not CSV. Save as .xlsx and upload again, or in Excel use File → Save As → CSV UTF-8 (Comma delimited).",
        });
      }

      const rows = await parseImportSpreadsheet(
        req.file.buffer
      );

      if (!rows.length) {
        return res.status(400).json({
          success: false,
          message: "CSV file is empty",
        });
      }

      const headerReport = getCsvHeaderReport(rows);

      if (!headerReport.ok) {
        return res.status(400).json({
          success: false,
          message: `Invalid CSV format. Missing columns: ${headerReport.missing.join(", ")}. Required: ${REQUIRED_CSV_COLUMNS.join(", ")}. Found: ${headerReport.headers.join(", ") || "(none)"}`,
        });
      }

      let restaurantsCreated = 0;
      let mealsCreated = 0;
      let skippedRows = 0;

      const resolveCoords = createGeocodeResolver();

      for (const row of rows) {
        const data = normalizeImportRow(row);

        if (!data) {
          skippedRows++;
          continue;
        }

        try {
          const coords = await resolveCoords(data.address);

          if (!coords) {
            skippedRows++;
            continue;
          }

          const imageUrl =
            await uploadCsvImageToCloudinary(
              data.image
            );

          let restaurant =
            await findRestaurant(
              data.restaurantName,
              data.address
            );

          if (!restaurant) {
            restaurant =
              await createRestaurant({
                name: data.restaurantName,
                suburb: data.address,
                latitude: coords.lat,
                longitude: coords.lng,
              });

            restaurantsCreated++;
          } else {
            restaurant =
              await updateRestaurantLocation(
                restaurant.id,
                {
                  latitude: coords.lat,
                  longitude: coords.lng,
                }
              );
          }

          await createMeal({
            restaurantId:
              restaurant.id,
            dishName: data.dishName,
            cuisine: data.cuisine,
            price: data.price,
            image: imageUrl,
            status: "APPROVED",
          });

          mealsCreated++;
        } catch (rowError) {
          console.log(rowError);
          skippedRows++;
        }
      }

      return res.status(200).json({
        success: true,
        message:
          "CSV imported successfully",
        restaurantsCreated,
        mealsCreated,
        skippedRows,
      });
    } catch (error) {
      console.log(error);

      if (
        error.message ===
        "Only CSV files are allowed"
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

// ======================================
// REPORTED / HIDDEN LISTINGS
// ======================================
const getReportedListings = async (req, res) => {
  try {
    const meals = await getReportedOrHiddenMeals();

    return res.status(200).json({
      success: true,

      count: meals.length,

      data: meals,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,

      message: "Internal server error",
    });
  }
};

// ======================================
// RESTORE LISTING
// ======================================
const restoreListing = async (req, res) => {
  try {
    const { mealId } = req.params;

    const meal = await restoreMealVisibility(mealId);

    return res.status(200).json({
      success: true,

      message: "Listing restored successfully",

      data: meal,
    });
  } catch (error) {
    console.log(error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,

        message: "Meal not found",
      });
    }

    return res.status(500).json({
      success: false,

      message: "Internal server error",
    });
  }
};

// ======================================
// SOFT-REJECT REPORTED LISTING
// ======================================
const rejectReportedListing = async (req, res) => {
  try {
    const { mealId } = req.params;

    const meal = await softRejectReportedListing(mealId);

    return res.status(200).json({
      success: true,

      message: "Listing rejected successfully",

      data: meal,
    });
  } catch (error) {
    console.log(error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,

        message: "Meal not found",
      });
    }

    return res.status(500).json({
      success: false,

      message: "Internal server error",
    });
  }
};

module.exports = {
  getPendingRequests,
  approveRequest,
  rejectRequest,
  importCsvController,
  getReportedListings,
  restoreListing,
  rejectReportedListing,
};
