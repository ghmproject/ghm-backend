const { Readable } = require("stream");
const csv = require("csv-parser");

const {
  getPendingMeals,
  approveMeal,
  rejectMeal,
} = require("../models/admin.model");

const {
  findRestaurant,
  createRestaurant,
  updateRestaurantLocation,
  createMeal,
} = require("../models/listing.model");

const REQUIRED_CSV_COLUMNS = [
  "restaurantName",
  "suburb",
  "dishName",
  "cuisine",
  "price",
  "latitude",
  "longitude",
  "image",
];

// ======================================
// PARSE CSV BUFFER
// ======================================
const parseCsvBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    const rows = [];

    Readable.from(buffer)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
};

// ======================================
// STRIP BOM / NORMALIZE CSV KEYS
// ======================================
const stripBom = (value) =>
  typeof value === "string"
    ? value.replace(/^\uFEFF/, "").trim()
    : value;

const normalizeCsvKeys = (row) => {
  const normalized = {};

  for (const [key, value] of Object.entries(row)) {
    const cleanKey = stripBom(key);

    normalized[cleanKey] =
      typeof value === "string"
        ? value.trim()
        : value;
  }

  return normalized;
};

// ======================================
// PARSE OPTIONAL COORDINATE
// ======================================
const parseOptionalFloat = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const num = Number(
    String(value).trim()
  );

  return Number.isNaN(num) ? null : num;
};

// ======================================
// VALIDATE CSV HEADERS
// ======================================
const validateCsvHeaders = (rows) => {
  if (!rows.length) {
    return false;
  }

  const headers = Object.keys(
    normalizeCsvKeys(rows[0])
  );

  return REQUIRED_CSV_COLUMNS.every((column) =>
    headers.includes(column)
  );
};

// ======================================
// VALIDATE & NORMALIZE ROW
// ======================================
const normalizeRow = (row) => {
  const clean = normalizeCsvKeys(row);

  const restaurantName =
    clean.restaurantName;
  const suburb = clean.suburb;
  const dishName = clean.dishName;
  const cuisine =
    clean.cuisine || null;
  const price = Number(clean.price);
  const latitude = parseOptionalFloat(
    clean.latitude
  );
  const longitude = parseOptionalFloat(
    clean.longitude
  );
  const image = clean.image || null;

  if (
    !restaurantName ||
    !suburb ||
    !dishName ||
    !cuisine
  ) {
    return null;
  }

  if (
    Number.isNaN(price) ||
    price < 0
  ) {
    return null;
  }

  if (
    latitude !== null &&
    Number.isNaN(latitude)
  ) {
    return null;
  }

  if (
    longitude !== null &&
    Number.isNaN(longitude)
  ) {
    return null;
  }

  return {
    restaurantName,
    suburb,
    dishName,
    cuisine,
    price,
    latitude,
    longitude,
    image,
  };
};

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

      if (
        !req.file.originalname
          .toLowerCase()
          .endsWith(".csv")
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Only CSV files are allowed",
        });
      }

      const rows = await parseCsvBuffer(
        req.file.buffer
      );

      if (!rows.length) {
        return res.status(400).json({
          success: false,
          message: "CSV file is empty",
        });
      }

      if (!validateCsvHeaders(rows)) {
        return res.status(400).json({
          success: false,
          message: `Invalid CSV format. Required columns: ${REQUIRED_CSV_COLUMNS.join(", ")}`,
        });
      }

      let restaurantsCreated = 0;
      let mealsCreated = 0;
      let skippedRows = 0;

      for (const row of rows) {
        const data = normalizeRow(row);

        if (!data) {
          skippedRows++;
          continue;
        }

        try {
          let restaurant =
            await findRestaurant(
              data.restaurantName,
              data.suburb
            );

          if (!restaurant) {
            restaurant =
              await createRestaurant({
                name: data.restaurantName,
                suburb: data.suburb,
                image: data.image,
                latitude: data.latitude,
                longitude:
                  data.longitude,
              });

            restaurantsCreated++;
          } else {
            restaurant =
              await updateRestaurantLocation(
                restaurant.id,
                {
                  latitude:
                    data.latitude,
                  longitude:
                    data.longitude,
                  image: data.image,
                }
              );
          }

          await createMeal({
            restaurantId:
              restaurant.id,
            dishName: data.dishName,
            cuisine: data.cuisine,
            price: data.price,
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

module.exports = {
  getPendingRequests,
  approveRequest,
  rejectRequest,
  importCsvController,
};
